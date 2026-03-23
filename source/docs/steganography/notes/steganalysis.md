# ML-based steganalysis

Classical steganalysis tools (stegdetect, StegoSuite) use fixed feature sets to detect
known embedding algorithms. They are reliable against the tools they were designed for and
largely useless against anything else. Modern steganalysis uses machine learning classifiers
trained on image pairs: clean originals and stego versions produced by specific tools.

## How it works

A steganalysis classifier takes an image as input and outputs a probability that the image
contains embedded data. Training requires a large balanced dataset of clean and stego images.
The images are typically represented not as raw pixels but as residuals: the difference
between the original image and a prediction of it based on neighbouring pixels. This
representation amplifies the subtle statistical distortions that embedding introduces.

The Spatial Rich Model (SRM) is the standard feature extraction method for classical
learned steganalysis. It applies 30 fixed filter kernels to the image residual and computes
high-order statistics of the filtered output. These features feed into an ensemble classifier
(SRM+Ensemble) that achieves detection rates above 90% against matched algorithms.

Deep learning classifiers (SRNet, Ye-Net, EfficientNet variants trained on Alaska2) learn
features directly from the residual without hand-engineering. They generalise better to
novel embedding and are more robust to parameter variation within a known algorithm.

## Aletheia

Aletheia is the most capable freely available steganalysis tool. It includes trained
models for the most common steganography tools and provides both single-image analysis
and batch processing.

Install:

```text
pip install aletheia
```

Analyse a single image:

```text
aletheia auto-test --image suspect.jpg
```

Output:

```text
Analysing suspect.jpg...
  steghide (JPEG):        0.82  [STEGO]
  nsF5 (JPEG):            0.31  [CLEAN]
  J-UNIWARD (JPEG):       0.44  [CLEAN]
  EfficientNet (general): 0.71  [STEGO]
```

A score above 0.5 indicates likely stego content. The specific algorithm scores help
identify what tool was used, which informs extraction attempts.

Batch analysis across a directory:

```text
aletheia auto-test --dir /path/to/images --output results.csv
```

Analyse with a specific model:

```text
aletheia srnet-predict --image suspect.jpg --model srnet-alaska2-steghide.pkl
```

## StegExpose

StegExpose applies four statistical tests (Chi-square, RS analysis, Sample Pairs, and
Primary Sets) and averages the results into a detection score. It is less capable than
Aletheia but faster for bulk screening.

```text
java -jar StegExpose.jar /path/to/images /path/to/results threshold
```

A threshold of 0.2 flags anything with a combined detection score above 20%. Lower
thresholds produce more false positives; higher thresholds miss more true positives.
For triage, 0.2 to 0.3 is a reasonable starting point.

## Limitations

Steganalysis classifiers are only reliable against algorithms they were trained on. A
clean score from Aletheia against all its default models means the image does not match
any known steghide/F5/JSteg/nsF5 pattern. It does not mean the image is clean.

Neural steganography (HiDDeN, StegaStamp) and coverless methods (SteganoGAN) are largely
invisible to current Aletheia models because no training data for these methods is included
in the default model set. Research-grade detectors for neural stego exist (Zhu et al.,
Boroumand et al.) but are not yet in common tooling.

Statistical detection also requires a minimum number of modified pixels to achieve
reliable accuracy. Very low payload density (a 100-bit key in a 4MP image) may fall below
the detection threshold even for matched algorithms.

## Acquiring a clean reference

Detection accuracy improves significantly when you have the original unmodified image to
compare against. Pixel-level comparison will immediately reveal any LSB modification.
Frequency-domain comparison reveals DCT coefficient changes.

```text
compare -metric AE clean.jpg suspect.jpg diff.png
```

`AE` (Absolute Error) counts pixels that differ between the two images. Any count above
zero indicates modification. This only works when you have the original, which in incident
response is not always available.

When the original is not available, reverse image search (TinEye, Google Images) may find
the source photograph. Social media metadata, EXIF timestamps, and camera model
information in the suspect image can also point to the original source.
