const fs = require('fs');
const path = require('path');

/**
 * MediaManager handles photo and document file operations —
 * saving, thumbnail generation, and path management.
 */
class MediaManager {
  constructor(photoDir, docDir) {
    this.photoDir = photoDir;
    this.docDir = docDir;

    if (!fs.existsSync(this.photoDir)) {
      fs.mkdirSync(this.photoDir, { recursive: true });
    }
    if (!fs.existsSync(this.docDir)) {
      fs.mkdirSync(this.docDir, { recursive: true });
    }
  }

  savePhoto(sourcePath, filename) {
    const destPath = path.join(this.photoDir, filename);
    try {
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);

        // Generate thumbnail asynchronously (non-blocking)
        this._generateThumbnail(destPath, filename).catch((e) =>
          console.warn('Thumbnail generation skipped:', e.message)
        );

        return `file://${destPath}`;
      }
      return null;
    } catch (error) {
      console.error('Failed to save photo:', error);
      return null;
    }
  }

  saveDocument(sourcePath, filename) {
    const destPath = path.join(this.docDir, filename);
    try {
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        return `file://${destPath}`;
      }
      return null;
    } catch (error) {
      console.error('Failed to save document:', error);
      return null;
    }
  }

  /**
   * Generates a thumbnail for a photo using sharp.
   * Thumbnails are stored with a `thumb_` prefix in the same directory.
   */
  async _generateThumbnail(sourcePath, filename, maxWidth = 380) {
    try {
      const sharp = require('sharp');
      const baseName = path.basename(filename || sourcePath);
      const thumbFilename = baseName.startsWith('thumb_') ? baseName : `thumb_${baseName}`;
      const thumbPath = path.join(this.photoDir, thumbFilename);

      // Skip if thumbnail already exists
      if (fs.existsSync(thumbPath)) return thumbPath;
      if (!fs.existsSync(sourcePath)) return null;

      await sharp(sourcePath)
        .resize({ width: maxWidth, withoutEnlargement: true })
        .jpeg({ quality: 75, progressive: true })
        .toFile(thumbPath);

      return thumbPath;
    } catch (e) {
      // sharp may not be available in all environments — fail gracefully
      console.warn('Thumbnail generation failed:', e.message);
      return null;
    }
  }

  /**
   * Scans photo directory on startup and generates missing thumbnails in background.
   */
  async backfillThumbnails() {
    try {
      if (!fs.existsSync(this.photoDir)) return;
      const files = fs.readdirSync(this.photoDir);
      const imageExts = new Set(['.jpg', '.jpeg', '.png', '.webp']);

      for (const file of files) {
        if (file.startsWith('thumb_') || file.startsWith('.')) continue;
        const ext = path.extname(file).toLowerCase();
        if (!imageExts.has(ext)) continue;

        const thumbName = `thumb_${file}`;
        const thumbPath = path.join(this.photoDir, thumbName);
        if (!fs.existsSync(thumbPath)) {
          const fullPath = path.join(this.photoDir, file);
          await this._generateThumbnail(fullPath, file);
        }
      }
    } catch (err) {
      console.warn('Thumbnail backfill error:', err.message);
    }
  }

  /**
   * Returns the thumbnail path for a given photo path.
   * Falls back to the original path if no thumbnail exists.
   */
  getThumbnailPath(photoPath) {
    if (!photoPath) return photoPath;
    const dir = path.dirname(photoPath);
    const filename = path.basename(photoPath);
    const thumbPath = path.join(dir, `thumb_${filename}`);
    return fs.existsSync(thumbPath) ? thumbPath : photoPath;
  }
}

module.exports = MediaManager;
