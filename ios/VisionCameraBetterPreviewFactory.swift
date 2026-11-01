import NitroModules
import VisionCamera

final class VisionCameraBetterPreviewFactory:
  HybridVisionCameraBetterPreviewFactorySpec
{
  func createPreviewOutput() throws -> any HybridCameraOutputSpec {
    throw RuntimeError.error(
      withMessage: "Better Preview output is not implemented yet."
    )
  }
}
