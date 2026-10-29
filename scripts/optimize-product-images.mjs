import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'

const API_ORIGIN = 'https://shop-api-kbe6.onrender.com'
const OUTPUT_DIR = path.resolve('public/images/products')

const imagePaths = [
  '/images/products/clothing/sneakers-6.jpg',
  '/images/products/clothing/sneakers-1.jpg',
  '/images/products/clothing/hoodie-4.jpg',
  '/images/products/clothing/dress-4.jpg',
  '/images/products/clothing/dress-3.jpg',
  '/images/products/clothing/jacket-3.jpg',
  '/images/products/clothing/jacket-4.jpg',
  '/images/products/clothing/dress-2.jpg',
  '/images/products/clothing/t-shirt-3.jpg',
]

async function optimizeImage(imagePath) {
  const url = `${API_ORIGIN}${imagePath}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`)
  }

  const input = Buffer.from(await response.arrayBuffer())

  const relativePath = imagePath.replace('/images/products/', '')
  const outputPath = path.join(OUTPUT_DIR, relativePath)

  await fs.mkdir(path.dirname(outputPath), { recursive: true })

  const baseName = path.basename(relativePath, path.extname(relativePath))
  const outputDirectory = path.dirname(outputPath)

  await sharp(input)
    .resize(360, 360, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 76 })
    .toFile(path.join(outputDirectory, `${baseName}-360.webp`))

  await sharp(input)
    .resize(640, 640, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toFile(path.join(outputDirectory, `${baseName}-640.webp`))

  console.log(`Optimized: ${imagePath}`)
}

await Promise.all(imagePaths.map(optimizeImage))
