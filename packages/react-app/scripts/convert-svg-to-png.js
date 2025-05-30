const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceSvg = path.join(__dirname, '../public/logo.svg');
const outputPng = path.join(__dirname, '../public/logo.png');

async function convertSvgToPng() {
  try {
    await sharp(sourceSvg)
      .resize(512, 512)
      .png()
      .toFile(outputPng);
    console.log('Successfully converted SVG to PNG!');
  } catch (error) {
    console.error('Error converting SVG to PNG:', error);
    process.exit(1);
  }
}

convertSvgToPng(); 