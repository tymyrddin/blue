# Runbook: analysing images for hidden content

A systematic workflow for determining whether a suspect image contains embedded data,
what tool was used, and extracting the content if possible.

## Triage: what you have

Before running tools, establish the basics:

```text
file suspect.jpg
exiftool suspect.jpg
```

Note: file format, dimensions, colour depth, EXIF metadata. Red flags in metadata:
missing camera model in a photograph (suggests the image was processed or generated),
comment fields containing unusual strings, GPS coordinates that do not match the claimed
context.

Check file size against visual complexity. A 3MB JPEG of a simple gradient is unusual;
a 3MB JPEG of a detailed outdoor scene is not. Large file size relative to apparent
visual content may indicate high-payload-density embedding.

Run a reverse image search (TinEye, Google Images) on the suspect image. If you can find
the original unmodified version, a pixel-level comparison is definitive.

## Metadata extraction

```text
exiftool -all suspect.jpg
strings suspect.jpg | head -100
```

`strings` on an image will show embedded text strings that are not part of the image
data: steghide headers, OpenStego markers, or cleartext payload fragments. steghide does
not write a human-readable marker, but some tools do.

Check for appended data beyond the JPEG end-of-image marker (`FF D9`):

```python
with open('suspect.jpg', 'rb') as f:
    data = f.read()

eoi = data.rfind(b'\xff\xd9')
if eoi != len(data) - 2:
    print(f'Appended data: {len(data) - eoi - 2} bytes after EOI')
    with open('appended.bin', 'wb') as out:
        out.write(data[eoi + 2:])
```

Appended data past the EOI marker is a simple and common hiding technique; binwalk will
also flag this.

## Automated steganalysis

```text
aletheia auto-test --image suspect.jpg
```

Note which algorithm scores above 0.5. This does not confirm the algorithm was used; it
indicates which training distribution the image most resembles. Use it to prioritise
extraction attempts.

For bulk screening of a directory:

```text
aletheia auto-test --dir ./images --output results.csv
sort -t',' -k2 -rn results.csv | head -20
```

Run StegExpose for a second opinion:

```text
java -jar StegExpose.jar ./images report.csv 0.2
```

## Extraction attempts

Start with the most common tools in order of detection likelihood:

steghide (JPEG, BMP, WAV):

```text
steghide info suspect.jpg
steghide extract -sf suspect.jpg -p '' -xf output.bin
```

Without a password, try a blank password first, then common passwords, then a wordlist:

```text
stegseek suspect.jpg /usr/share/wordlists/rockyou.txt
```

stegseek is a fast steghide password cracker that processes rockyou in under a minute on
modern hardware. If stegseek finds a match, it also extracts the payload.

For PNG and BMP images, zsteg:

```text
zsteg suspect.png
zsteg -a suspect.png   # try all channel/bit combinations
```

zsteg reports strings found in each bit plane. Human-readable text in any LSB plane
confirms hidden content. Binary data requires further analysis.

For JPEG, check for F5 and OutGuess:

```text
outguess -r suspect.jpg output.txt
```

For general binary analysis of extracted content, check what was found:

```text
file output.bin
strings output.bin | head -50
binwalk output.bin
```

## LSB visualisation

Visualising the LSB plane directly can confirm manual embedding before extraction:

```python
from PIL import Image
import numpy as np

img = np.array(Image.open('suspect.png'))
lsb = (img & 1) * 255  # extract LSB, scale to visible range
Image.fromarray(lsb.astype(np.uint8)).save('lsb_plane.png')
```

A random LSB plane looks like white noise. A pattern, gradient, or recognisable structure
in the LSB plane indicates the bits were deliberately placed. An ordered
sequential fill (reading order across the image) is characteristic of simple LSB tools.

## Frequency domain analysis

For JPEG images, plot the DCT coefficient histogram to check for quantisation
irregularities typical of DCT-based embedding (F5, JSteg):

```python
import numpy as np
from scipy.fftpack import dct
from PIL import Image
import matplotlib.pyplot as plt

img = np.array(Image.open('suspect.jpg').convert('L'), dtype=float)
# process 8x8 blocks
h, w = img.shape
coeffs = []
for i in range(0, h-7, 8):
    for j in range(0, w-7, 8):
        block = dct(dct(img[i:i+8, j:j+8], axis=0), axis=1)
        coeffs.extend(block.flatten().tolist())

plt.hist(coeffs, bins=100, range=(-50, 50))
plt.savefig('dct_histogram.png')
```

A normal JPEG has a smooth, bell-shaped DCT coefficient histogram. JSteg-modified JPEGs
show pairs of adjacent coefficient values with unusual symmetry; F5 shows a characteristic
dip at zero. Compare against a known-clean JPEG from the same camera for reference.

## Document findings

Record for each image analysed:

- File hash (SHA256)
- exiftool output
- Aletheia scores for all tested models
- Extraction attempts made and results
- Any payload recovered: file type, content summary, hash

If payload is recovered, treat it as potentially hostile: open in an isolated environment.
