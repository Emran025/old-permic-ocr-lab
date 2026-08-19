# Old Permic OCR Lab

> A research-oriented web application and data-preparation workspace for exploring **Old Permic** sources and building reproducible OCR training datasets.

Old Permic OCR Lab combines a browser-based research interface with an auditable synthetic-data workflow. It is designed to keep source provenance, image rights, dataset splits, class maps, and validation evidence visible throughout preparation for object-detection and OCR experiments.

## Project status

This repository is a **research and data-preparation prototype**. It includes source-cataloguing tools, synthetic dataset generation, validation workflows, and an interface for reviewing analysis records. It does **not** ship a trained Old Permic recognition model or claim production-grade transcription accuracy.

| Area              | Included                                                                                 | Not included                                          |
| ----------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Source research   | Catalogued sources, provenance and rights metadata, and image review workflows           | A claim that every linked source may be redistributed |
| Synthetic data    | Reproducible S0, S1, and S2 generation stages with recorded manifests                    | A substitute for expert-labelled historical material  |
| Model preparation | YOLO-compatible labels, deterministic dataset splits, validation, and notebook workflows | A trained `best.pt` weight or live inference service  |
| Web application   | Research views, source library, synthetic lab, and analysis records                      | Guaranteed scholarly transcription results            |

## Capabilities

The application provides a research-focused environment for reviewing Old Permic materials while retaining the provenance needed to evaluate training inputs. The included data workflow creates and validates structured assets rather than silently mixing synthetic and archival material.

| Capability              | Description                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source library          | Displays documented Old Permic source material with preservation, cataloguing, and rights metadata.                                                           |
| Synthetic lab           | Explores staged synthetic examples for individual glyphs, structured lines, and structured pages.                                                             |
| Reproducible generation | Uses the `old_permic_synthetic_generation.ipynb` notebook as the single source of truth for synthetic generation, validation, training, and evaluation cells. |
| Dataset validation      | Checks YOLO labels, class mappings, split boundaries, and page-level leakage before handoff.                                                                  |
| Analysis records        | Supports image-upload and analysis-record workflows; live recognition depends on separately provisioned, validated model weights.                             |

## Architecture

| Path        | Purpose                                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| `client/`   | React and Vite browser application, including research views and interface tests.                               |
| `server/`   | Express and tRPC application layer, authentication routes, storage proxy, and domain APIs.                      |
| `shared/`   | Shared types and domain definitions.                                                                            |
| `training/` | Dataset contracts, validation resources, class-map templates, notebooks, and synthetic-data documentation.      |
| `scripts/`  | Utilities for rendering the generation notebook, preparing source-gallery assets, and validating data packages. |
| `drizzle/`  | Database schema and migration resources.                                                                        |

## Quick start

### Prerequisites

Install a current Node.js runtime and use the package manager version pinned in `package.json`. The project uses **pnpm** and has been developed with Node.js 22.

```bash
git clone https://github.com/Emran025/old-permic-ocr-lab.git
cd old-permic-ocr-lab
pnpm install
pnpm dev
```

The development server starts on `http://localhost:3000` by default. If that port is occupied, the server selects the next available port.

### Environment configuration

The server loads environment variables through `dotenv`. Local configuration may be required for database access, authentication, object storage, or built-in model integrations. Depending on the features enabled in your environment, configure the following values without committing secrets:

```dotenv
DATABASE_URL=
JWT_SECRET=
OAUTH_SERVER_URL=
OWNER_OPEN_ID=
VITE_APP_ID=
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
```

If these integrations are not configured, keep development focused on the sections of the application that do not depend on them.

## Quality checks

Use the repository scripts to type-check, test, format, and build the application.

```bash
pnpm check
pnpm test
pnpm format
pnpm build
pnpm start
```

The test suite includes interface, dataset, notebook, and API-focused checks. Run the relevant validation utilities before accepting or training on a new real labelled dataset.

## Training workflow

Synthetic dataset creation, validation, and training guidance live under `training/`. The canonical notebook is:

```text
training/notebooks/old_permic_synthetic_generation.ipynb
```

The staged generation workflow distinguishes:

| Stage | Dataset unit     | Intended role                                                           |
| ----- | ---------------- | ----------------------------------------------------------------------- |
| `S0`  | Individual glyph | Establish a balanced character-level baseline.                          |
| `S1`  | Structured line  | Introduce line-level composition and layout.                            |
| `S2`  | Structured page  | Introduce page-level composition and more realistic document structure. |

For the expected real-data package, annotation rules, split requirements, and model-weight handoff, consult [the training guide](training/README_AR.md) and the validation resources in `training/`.

> **Data integrity principle:** Do not treat synthetic material as a replacement for legally usable, accurately labelled historical sources. Keep source rights, annotations, class maps, and `train`/`val`/`test` splits independently reviewable.

## Contributing

Contributions should preserve the repository’s research integrity. Keep source metadata and rights information explicit; do not add unverified transcriptions or model results; avoid data leakage between train, validation, and test splits; and add or update tests whenever application or validation behaviour changes.

Before opening a pull request, run:

```bash
pnpm check
pnpm test
```

## License

This project is licensed under the [Apache License 2.0](LICENSE). By contributing, you agree that your contributions are licensed under the same terms.

## References

[1] [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0)

[2] [Partanen et al., _Towards an Old Permic Universal Dependencies Treebank_](https://jdmdh.episciences.org/13715/pdf)
