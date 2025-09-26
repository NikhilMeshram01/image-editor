// import {
//   env,
//   AutoModel,
//   AutoProcessor,
//   RawImage,
//   PreTrainedModel,
//   Processor,
// } from "@huggingface/transformers";

// const MODEL_ID = "briaai/RMBG-1.4";

// interface ModelState {
//   model: PreTrainedModel | null;
//   processor: Processor | null;
//   currentModelId: string;
// }

// const state: ModelState = {
//   model: null,
//   processor: null,
//   currentModelId: MODEL_ID,
// };

// export async function initializeModel(): Promise<boolean> {
//   try {
//     env.allowLocalModels = false;
//     if (env.backends?.onnx?.wasm) {
//       env.backends.onnx.wasm.proxy = true;
//     }

//     state.model = await AutoModel.from_pretrained(MODEL_ID);
//     state.processor = await AutoProcessor.from_pretrained(MODEL_ID);
//     state.currentModelId = MODEL_ID;
//     return true;
//   } catch (error) {
//     console.error("Error initializing model:", error);
//     throw new Error(
//       error instanceof Error
//         ? error.message
//         : "Failed to initialize background removal model"
//     );
//   }
// }

// export async function processImage(
//   image: File
// ): Promise<{ maskFile: File; processedFile: File } | null> {
//   if (!state.model || !state.processor) {
//     throw new Error("Model not initialized. Call initializeModel() first.");
//   }

//   const objectUrl = URL.createObjectURL(image);
//   try {
//     const img = await RawImage.fromURL(objectUrl);

//     // Pre-process image
//     const { pixel_values } = await state.processor(img);

//     // Predict alpha matte
//     const { output } = await state.model({ input: pixel_values });

//     // Resize mask to original size
//     const maskData = (
//       await RawImage.fromTensor(output[0].mul(255).to("uint8")).resize(
//         img.width,
//         img.height
//       )
//     ).data;

//     // Create mask canvas
//     const maskCanvas = document.createElement("canvas");
//     maskCanvas.width = img.width;
//     maskCanvas.height = img.height;
//     const maskCtx = maskCanvas.getContext("2d");
//     if (!maskCtx) throw new Error("Could not get 2d context");

//     // Draw mask data
//     const maskPixelData = maskCtx.createImageData(img.width, img.height);
//     for (let i = 0; i < maskData.length; ++i) {
//       const value = maskData[i];
//       maskPixelData.data[4 * i] = value;
//       maskPixelData.data[4 * i + 1] = value;
//       maskPixelData.data[4 * i + 2] = value;
//       maskPixelData.data[4 * i + 3] = 255;
//     }
//     maskCtx.putImageData(maskPixelData, 0, 0);

//     // Convert mask to blob
//     const maskBlob = await new Promise<Blob>((resolve, reject) =>
//       maskCanvas.toBlob(
//         (blob) =>
//           blob
//             ? resolve(blob)
//             : reject(new Error("Failed to create mask blob")),
//         "image/png"
//       )
//     );
//     const maskFileName = `${image.name.split(".")[0]}-mask.png`;
//     const maskFile = new File([maskBlob], maskFileName, { type: "image/png" });

//     // Create processed image canvas
//     const canvas = document.createElement("canvas");
//     canvas.width = img.width;
//     canvas.height = img.height;
//     const ctx = canvas.getContext("2d");
//     if (!ctx) throw new Error("Could not get 2d context");

//     // Draw original image
//     ctx.drawImage(img.toCanvas(), 0, 0);

//     // Apply mask to alpha channel
//     const pixelData = ctx.getImageData(0, 0, img.width, img.height);
//     for (let i = 0; i < maskData.length; ++i) {
//       pixelData.data[4 * i + 3] = maskData[i];
//     }
//     ctx.putImageData(pixelData, 0, 0);

//     // Convert to blob
//     const blob = await new Promise<Blob>((resolve, reject) =>
//       canvas.toBlob(
//         (blob) =>
//           blob
//             ? resolve(blob)
//             : reject(new Error("Failed to create processed blob")),
//         "image/png"
//       )
//     );
//     const fileName = image.name.split(".")[0];
//     const processedFile = new File([blob], `${fileName}-bg-removed.png`, {
//       type: "image/png",
//     });

//     return { maskFile, processedFile };
//   } catch (error) {
//     console.error("Error processing image:", error);
//     throw new Error(
//       error instanceof Error ? error.message : "Failed to process image"
//     );
//   } finally {
//     URL.revokeObjectURL(objectUrl);
//   }
// }

import {
  env,
  AutoModel,
  AutoProcessor,
  RawImage,
  PreTrainedModel,
  Processor,
} from "@huggingface/transformers";

const MODEL_ID = "briaai/RMBG-1.4";

interface ModelState {
  model: PreTrainedModel | null;
  processor: Processor | null;
  currentModelId: string;
  isInitializing: boolean;
  isInitialized: boolean;
}

const state: ModelState = {
  model: null,
  processor: null,
  currentModelId: MODEL_ID,
  isInitializing: false,
  isInitialized: false,
};

// export async function initializeModel(): Promise<boolean> {
//   try {
//     env.allowLocalModels = false;
//     if (env.backends?.onnx?.wasm) {
//       env.backends.onnx.wasm.proxy = true;
//     }

//     state.model = await AutoModel.from_pretrained(MODEL_ID);
//     state.processor = await AutoProcessor.from_pretrained(MODEL_ID);
//     state.currentModelId = MODEL_ID;
//     return true;
//   } catch (error) {
//     console.error("Error initializing model:", error);
//     throw new Error(
//       error instanceof Error
//         ? error.message
//         : "Failed to initialize background removal model"
//     );
//   }
// }

export async function initializeModel(): Promise<boolean> {
  // If already initialized, return true
  if (state.isInitialized) return true;

  // If currently initializing, wait for it to complete
  if (state.isInitializing) {
    return new Promise((resolve) => {
      const checkInitialized = () => {
        if (state.isInitialized) {
          resolve(true);
        } else {
          setTimeout(checkInitialized, 100);
        }
      };
      checkInitialized();
    });
  }

  try {
    state.isInitializing = true;
    env.allowLocalModels = false;
    if (env.backends?.onnx?.wasm) {
      env.backends.onnx.wasm.proxy = true;
    }

    state.model = await AutoModel.from_pretrained(MODEL_ID);
    state.processor = await AutoProcessor.from_pretrained(MODEL_ID);
    state.currentModelId = MODEL_ID;
    state.isInitialized = true;
    return true;
  } catch (error) {
    console.error("Error initializing model:", error);
    state.isInitializing = false;
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to initialize background removal model"
    );
  } finally {
    state.isInitializing = false;
  }
}

// Add this function to check initialization status
export function isModelInitialized(): boolean {
  return state.isInitialized;
}

export async function processImage(
  image: File
): Promise<{ maskFile: File; processedFile: File } | null> {
  if (!state.isInitialized || !state.model || !state.processor) {
    throw new Error("Model not initialized. Call initializeModel() first.");
  }

  // if (!state.model || !state.processor) {
  //   throw new Error("Model not initialized. Call initializeModel() first.");
  // }

  const objectUrl = URL.createObjectURL(image);
  try {
    const img = await RawImage.fromURL(objectUrl);

    // Pre-process image
    const { pixel_values } = await state.processor(img);

    // Predict alpha matte
    const { output } = await state.model({ input: pixel_values });

    // Resize mask to original size
    const maskData = (
      await RawImage.fromTensor(output[0].mul(255).to("uint8")).resize(
        img.width,
        img.height
      )
    ).data;

    // Create mask canvas
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = img.width;
    maskCanvas.height = img.height;
    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) throw new Error("Could not get 2d context");

    // Draw mask data
    const maskPixelData = maskCtx.createImageData(img.width, img.height);
    for (let i = 0; i < maskData.length; ++i) {
      const value = maskData[i];
      maskPixelData.data[4 * i] = value;
      maskPixelData.data[4 * i + 1] = value;
      maskPixelData.data[4 * i + 2] = value;
      maskPixelData.data[4 * i + 3] = 255;
    }
    maskCtx.putImageData(maskPixelData, 0, 0);

    // Convert mask to blob
    const maskBlob = await new Promise<Blob>((resolve, reject) =>
      maskCanvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("Failed to create mask blob")),
        "image/png"
      )
    );
    const maskFileName = `${image.name.split(".")[0]}-mask.png`;
    const maskFile = new File([maskBlob], maskFileName, { type: "image/png" });

    // Create processed image canvas
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2d context");

    // Draw original image
    ctx.drawImage(img.toCanvas(), 0, 0);

    // Apply mask to alpha channel
    const pixelData = ctx.getImageData(0, 0, img.width, img.height);
    for (let i = 0; i < maskData.length; ++i) {
      pixelData.data[4 * i + 3] = maskData[i];
    }
    ctx.putImageData(pixelData, 0, 0);

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("Failed to create processed blob")),
        "image/png"
      )
    );
    const fileName = image.name.split(".")[0];
    const processedFile = new File([blob], `${fileName}-bg-removed.png`, {
      type: "image/png",
    });

    return { maskFile, processedFile };
  } catch (error) {
    console.error("Error processing image:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to process image"
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
