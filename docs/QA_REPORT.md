# DoKit launch QA report

Audit date: 2026-08-23
Target: Next.js 16.2.6 production build
Status: Launch candidate with the residual risks listed below

## Verification summary

| Check | Result | Evidence |
| --- | --- | --- |
| Automated regression suite | Passed | 9/9 tests |
| TypeScript | Passed | `tsc --noEmit`, zero errors |
| ESLint | Passed with warnings | Zero errors; 9 intentional dynamic-image warnings |
| Production build | Passed | 53/53 static pages generated |
| Tool catalog integrity | Passed | 44 unique feature IDs and slugs |
| Tool route sweep | Passed | 44/44 routes rendered; zero “Coming Soon” fallbacks |
| Browser console | Passed | Zero errors or warnings during the 44-route sweep |
| Fixed edge-case retests | Passed | Regex zero-width, snippets, pattern extraction, Unicode, invalid bytes, password pool/classes, and JWT wording |
| File-upload processing | Unrun | The in-app test browser did not expose its file chooser to automation |

## Issue log

All resolved items below were reproduced or confirmed by code/build evidence and retested after the fix.

| ID | Severity | Issue | Resolution | Status |
| --- | --- | --- | --- | --- |
| DOK-001 | P0 | Production build depended on downloading a Google font | Replaced the remote font dependency with a local system-font stack | Fixed |
| DOK-002 | P1 | A blocking splash delayed every visit by about 6.3 seconds | Removed the blocking splash from the root layout | Fixed |
| DOK-003 | P1 | Catalog and marketing counts drifted from the actual 44 tools | Corrected counts, derived metadata from `tools.length`, and added catalog consistency tests | Fixed |
| DOK-004 | P1 | Theme selection did not persist across navigation/reload | Persisted the theme and verified it through navigation | Fixed |
| DOK-005 | P1 | Network-backed tools appeared fully local | Added catalog badges and page-level disclosures for API Tester, QR Builder, and YouTube Inspector | Fixed |
| DOK-006 | P1 | Several feature names/descriptions promised unsupported output or processing | Corrected PDF, image layout, OCR, background removal, currency, hash, icon, and wireframe claims | Fixed |
| DOK-007 | P0 | Markdown preview accepted executable HTML/unsafe links | Escaped raw HTML, neutralized unsafe URLs, and regression-tested the payload | Fixed |
| DOK-008 | P0 | User text could enter generated SVG or print HTML without escaping | Added shared HTML escaping and sanitized SVG color/text values | Fixed |
| DOK-009 | P1 | React/TypeScript issues blocked a reliable launch build | Corrected the component state/effect/type failures | Fixed |
| DOK-010 | P1 | Root metadata requested a deleted `/favicon.ico` | Removed the broken reference and added a metadata-asset regression test | Fixed |
| DOK-011 | P0 | Regex Builder froze on zero-width patterns such as `^` | Advanced `lastIndex` after empty matches and added termination tests | Fixed |
| DOK-012 | P1 | Regex snippets changed Python backslash semantics and failed to escape JS/PHP delimiters | Centralized and corrected language-specific snippet generation | Fixed |
| DOK-013 | P1 | Text Pattern Extractor returned capture groups as duplicate results when `g` was omitted | Always uses a global matching pass for extraction | Fixed |
| DOK-014 | P1 | Unicode Escape encoding lost the low surrogate for emoji | Encodes every UTF-16 code unit; `A😀` now round-trips correctly | Fixed |
| DOK-015 | P1 | Invalid Hex/Binary tokens silently decoded to null bytes | Added exact byte validation and fatal UTF-8 decoding with visible errors | Fixed |
| DOK-016 | P1 | Password entropy used an inaccurate excluded-character count and generation did not guarantee selected classes | Computes the real pool, uses unbiased secure selection, guarantees available classes, and disables an empty pool | Fixed |
| DOK-017 | P1 | JWT status said “Valid” even though signatures are not verified | Changed the badge to “Not expired (signature unverified)” | Fixed |
| DOK-018 | P1 | Rapid Hash Generator input could let an older asynchronous result overwrite newer text | Added generation IDs, parallel digesting, and stale-result cancellation | Fixed |
| DOK-019 | P2 | README was unchanged starter boilerplate and documented removed font behavior | Replaced it with DoKit run, QA, privacy, and product-limit documentation | Fixed |
| DOK-020 | P2 | The project had no repeatable regression command | Added `yarn test` with catalog, route, kit, metadata, disclosure, regex, and injection checks | Fixed |

## Browser flows verified

- Immediate home render without a blocking splash
- Theme persistence across navigation
- Catalog search and all catalog links
- Text extraction/deduplication behavior
- Regex normal, invalid, zero-width, and snippet behavior
- Encoder/Decoder emoji round-trip and invalid Hex validation
- Password generation length, selected-character classes, and empty-pool state
- Hash known vector generation and comparison
- Markdown and SVG injection regressions
- API Tester CORS-enabled GET behavior
- QR rendering and network disclosure
- All 44 tool workspaces render in the production build

## Residual risks and unrun checks

1. Upload-dependent workflows were source-reviewed, type-checked, built, and route-rendered, but their real file chooser/process/export sequence was not automated in this environment. This affects Image Compressor, Text Extractor file input, Image Print Layout, PDF to Word, Background Remover, certificate logos, resume photos, social mockup images, and ID-card assets.
2. Browser print windows and generated file downloads were not validated byte-for-byte. Their UI actions and code paths compile, but output fidelity should receive one manual smoke pass before paid traffic.
3. Regex Builder still executes user regexes on the main browser thread. Pathological catastrophic-backtracking expressions can freeze the tab even though the zero-width infinite loop is fixed.
4. ESLint reports nine `no-img-element` warnings. These are user-generated blob previews or external/dynamic images where `next/image` is not automatically suitable; there are no lint errors.
5. Currency values are deliberately approximate offline reference rates and must not be marketed as live financial data.

## Removal candidate

If an immediate launch leaves no time to isolate regex evaluation in a Web Worker with a timeout, hide **Regex Builder** temporarily. It is the only feature with a remaining input-driven tab-freeze risk. The next-best removal candidate for product focus is **Sketch & Wireframe Tool**, because Diagram Builder and SVG System Builder already cover much of its use case with more structured output.
