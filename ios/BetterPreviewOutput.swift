import AVFoundation
import CoreMedia
import Foundation
import NitroModules
import UIKit
import VisionCamera

typealias CameraSize = margelo.nitro.camera.Size

final class BetterPreviewOutput: HybridCameraPreviewOutputSpec,
  NativePreviewViewOutput
{
  let mediaType: MediaType = .video
  let previewLayer = AVCaptureVideoPreviewLayer()
  let streamType: StreamType = .video

  private let options: BetterPreviewOutputOptions
  private var currentConfiguration: BetterPreviewConfiguration?
  private var rotationCoordinator: NSObject?
  private var rotationObserver: NSKeyValueObservation?
  private var formatDescriptionObserver: NSObjectProtocol?

  var outputOrientation: CameraOrientation {
    get { .up }
    set {
      // Preview orientation is controlled by AVCaptureDevice.RotationCoordinator.
    }
  }

  var currentResolution: CameraSize? {
    previewLayer.connection?.inputStreamResolution
  }

  var targetResolution: ResolutionRule {
    if let targetResolution = options.targetResolution {
      return .closestTo(
        CameraSize(
          width: targetResolution.width,
          height: targetResolution.height
        )
      )
    }

    let screenSize = UIScreen.main.bounds.size
    let scale = UIScreen.main.scale
    return .min(
      CameraSize(
        width: screenSize.width * scale,
        height: screenSize.height * scale
      )
    )
  }

  init(options: BetterPreviewOutputOptions) {
    self.options = options
    previewLayer.videoGravity = .resizeAspectFill
    super.init()
  }

  deinit {
    stopObservingFormatDescription()
    stopObservingRotation()
  }

  func configure(config _: OutputConfiguration) {
    stopObservingFormatDescription()

    guard let connection = previewLayer.connection else { return }
    connection.automaticallyAdjustsVideoMirroring = true

    if #available(iOS 17.0, *) {
      configureRotationCoordinator(connection: connection)
    }

    observeFormatDescription(on: connection)
  }

  @available(iOS 17.0, *)
  private func configureRotationCoordinator(connection: AVCaptureConnection) {
    stopObservingRotation()

    guard
      let input = connection.inputPorts
        .first(where: { $0.mediaType == .video })?.input
        as? AVCaptureDeviceInput
    else { return }

    let coordinator = AVCaptureDevice.RotationCoordinator(
      device: input.device,
      previewLayer: previewLayer
    )
    rotationCoordinator = coordinator
    rotationObserver = coordinator.observe(
      \.videoRotationAngleForHorizonLevelPreview,
      options: [.initial, .new]
    ) { [weak self, weak connection] coordinator, _ in
      guard
        let self,
        let connection,
        self.previewLayer.connection === connection
      else { return }

      let angle = coordinator.videoRotationAngleForHorizonLevelPreview
      guard connection.isVideoRotationAngleSupported(angle) else { return }
      connection.videoRotationAngle = angle
      self.updateConfiguration(connection)
    }
  }

  private func observeFormatDescription(on connection: AVCaptureConnection) {
    guard let port = connection.inputPorts.first else { return }

    formatDescriptionObserver = NotificationCenter.default.addObserver(
      forName: AVCaptureInput.Port.formatDescriptionDidChangeNotification,
      object: port,
      queue: nil
    ) { [weak self, weak connection] _ in
      guard let self, let connection else { return }
      self.updateConfiguration(connection)
    }

    updateConfiguration(connection)
  }

  private func updateConfiguration(_ connection: AVCaptureConnection) {
    let resolution = resolveInputResolution(connection)
    guard let resolution else { return }

    let rotationDegrees: Double?
    if #available(iOS 17.0, *) {
      rotationDegrees = connection.videoRotationAngle
    } else {
      rotationDegrees = nil
    }

    let configuration = BetterPreviewConfiguration(
      resolution: resolution,
      rotationDegrees: rotationDegrees
    )
    if configurationsMatch(currentConfiguration, configuration) { return }

    currentConfiguration = configuration
    options.onConfigurationChanged?(configuration)
  }

  private func resolveInputResolution(
    _ connection: AVCaptureConnection
  ) -> Size? {
    if let resolution = connection.inputStreamResolution {
      return Size(
        width: resolution.width,
        height: resolution.height
      )
    }

    guard
      let input = connection.inputPorts.first?.input as? AVCaptureDeviceInput
    else { return nil }

    let dimensions = CMVideoFormatDescriptionGetDimensions(
      input.device.activeFormat.formatDescription
    )
    return Size(
      width: Double(dimensions.width),
      height: Double(dimensions.height)
    )
  }

  private func configurationsMatch(
    _ lhs: BetterPreviewConfiguration?,
    _ rhs: BetterPreviewConfiguration
  ) -> Bool {
    guard let lhs else { return false }
    return lhs.resolution.width == rhs.resolution.width
      && lhs.resolution.height == rhs.resolution.height
      && lhs.rotationDegrees == rhs.rotationDegrees
  }

  private func stopObservingRotation() {
    rotationObserver?.invalidate()
    rotationObserver = nil
    rotationCoordinator = nil
  }

  private func stopObservingFormatDescription() {
    guard let observer = formatDescriptionObserver else { return }
    NotificationCenter.default.removeObserver(observer)
    formatDescriptionObserver = nil
  }
}
