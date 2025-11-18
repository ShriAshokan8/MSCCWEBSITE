# MSC Nexus Editor

This directory will contain the built web editor output.

## Expected Structure

After building the editor, this directory should contain:
- `index.html` - Main entry point for the MSC Nexus editor
- JavaScript bundles
- CSS files
- Assets (images, fonts, etc.)

## Build Instructions

The MSC Nexus editor build output should be placed here. The build process will be configured in a later step to output to this directory.

## Integration

The wrapper page (`/nexus/index.html`) loads the editor via an iframe:
```html
<iframe src="./editor/index.html"></iframe>
```

This allows the MSC Nexus wrapper to provide authentication and branding while the editor handles document editing functionality.
