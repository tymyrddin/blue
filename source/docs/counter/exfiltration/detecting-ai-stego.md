# Detecting AI-generated steganography

Classical steganalysis is built around a core assumption: there is an original clean image,
and the stego process modified it. The detector looks for the traces of modification. When
the image was never modified because it was generated with the payload already encoded,
this assumption fails entirely.

## Why the classic approach fails

A classifier trained to distinguish modified JPEG images from clean ones learns the
statistical signature of the modification: DCT coefficient distribution anomalies, pixel
residual patterns, histogram asymmetries. These signatures are properties of the
modification process, not the carrier.

A GAN-generated image carrying a payload via SteganoGAN, or a diffusion-generated image
with latent noise encoding, was never modified. Its statistical properties reflect the
generative model's training distribution. The classifier has nothing to find.

The only detectable property is that the image is AI-generated, which is a different
problem from steganography detection.

## Detecting AI-generated images

AI content detectors attempt to identify images produced by generative models. The approach
varies by generation method:

GAN-generated images: GANs produce characteristic spectral artefacts in the high-frequency
range due to the upsampling operations in the generator. These are visible in the Fourier
spectrum of the image and detectable with classifiers trained on GAN outputs.

```python
import numpy as np
from PIL import Image

img = np.array(Image.open('suspect.jpg').convert('L'))
spectrum = np.abs(np.fft.fftshift(np.fft.fft2(img)))
log_spectrum = np.log(spectrum + 1)
# characteristic grid patterns in log_spectrum indicate GAN upsampling artefacts
```

Diffusion-generated images: diffusion models produce different high-frequency noise
statistics from both camera images and GAN outputs. Detectors trained on diffusion outputs
(DIRE, UnivFD) achieve high accuracy on images from known models but generalise poorly to
new architectures.

AI watermarking: Stable Diffusion and commercial image generators increasingly embed
invisible watermarks in generated output using C2PA or similar standards. These watermarks
are themselves steganographic, but their presence indicates a generated image and can be
detected with the respective verification tool.

```text
# C2PA verification
pip install c2pa-python
python -c "import c2pa; print(c2pa.read_file('suspect.jpg'))"
```

## Limitations

None of these approaches reliably detect AI-generated steganography in a forensic sense.
They detect AI-generated images. An attacker using a small fine-tuned model not represented
in the detector's training distribution, or a model that has been adversarially trained
to evade GAN detectors, will produce images that score clean.

The practical defensive implication is that per-file detection tools are insufficient.
Detection must move up the stack toward behavioural and traffic analysis.

## Indicators that do not rely on image content

Focus on what the attacker has to do regardless of the embedding method:

The image must be transferred. An endpoint downloading images from an unusual source, at
an unusual time, at regular intervals, is worth investigating even if the images look
clean. Steganographic C2 depends on periodic polling; that periodicity is detectable in
network logs.

The agent must process the image. Tools associated with steganography (steghide, zsteg,
Python scripts importing stego libraries) running on an endpoint are an indicator of
extraction activity, not just delivery.

The payload must be executed or used. The post-extraction behaviour (process creation,
network connections, file writes) is subject to normal endpoint detection regardless of
how the payload arrived.

## Practical detection posture

Given the limitations of per-file analysis:

Screen images at the network boundary using Aletheia and StegExpose as a triage layer.
This catches classical methods and may catch poorly implemented neural methods.

Monitor endpoints for stego tool installation and execution. This catches the extraction
side regardless of the embedding method.

Watch for periodic image retrieval patterns in network logs. Steganographic C2 leaves a
timing footprint even when the content is undetectable.

Treat AI-generated image detection as a useful signal. An AI-generated
image is not proof of steganographic content, but it raises the prior probability enough
to justify deeper investigation.
Last updated: 10 July 2026
