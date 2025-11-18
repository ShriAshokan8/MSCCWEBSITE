# Engine Bindings

This directory contains integration code that bridges the MSC Nexus Editor UI with the underlying editor engine runtime.

## Purpose

The engine bindings layer provides:

- **Engine Initialization**: Loading and starting the editor engine with MSC configuration
- **API Bridge**: Exposing engine functionality through a clean API for the MSC UI
- **Branding Overrides**: Applying MSC theming and hiding original engine branding
- **Event Handling**: Managing communication between the UI and engine

## Files

### `bindings.js`

Main integration module that handles:
- Loading engine dependencies from `/nexus/frontend` or built assets
- Initializing the engine with MSC Nexus configuration
- Creating API interfaces for document and workspace operations
- Applying runtime branding overrides

## Future Implementation

In subsequent steps, this module will be expanded to:

1. Load the actual engine runtime (Flutter web output, WASM, etc.)
2. Initialize the engine with proper configuration
3. Mount the engine into the editor container
4. Implement full CRUD operations for documents and workspaces
5. Handle real-time collaboration features
6. Manage engine state and synchronization

## Integration Pattern

```javascript
import { initializeEngine, applyMscBrandingOverrides } from './engine-bindings/bindings.js';

// Initialize engine
const { instance, api } = await initializeEngine(containerElement);

// Apply MSC branding
applyMscBrandingOverrides();

// Use engine API
await api.createDocument('New Document');
```

## Configuration

Engine configuration is defined in `ENGINE_CONFIG` and includes:
- Asset paths
- MSC branding settings
- Feature flags
- Theme overrides

This ensures the engine operates with MSC Nexus branding and configuration from the start.
