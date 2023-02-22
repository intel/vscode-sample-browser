# Change Log

## 0.0.49

- Update dependencies

## 0.0.48

- Update dependencies

## 0.0.47

- Update dependencies

## 0.0.46

- Minor changes.
- Update dependencies

## 0.0.45

- Corrected link to environment extension

## 0.0.44

- Minor doc changes for clarity.
- Update dependencies

## 0.0.43

- Fix issue with auto incremented paths with illegal characters

## 0.0.42

- Fix issue with illegal characters in paths in Windows

## 0.0.41

- Improve handling during sample creation to avoid overwriting samples

## 0.0.40

- Improve handling of preferences/settings

## 0.0.38

- Add support for fortran
- Add sample browsing via QuickPick command palette UI
- Bump lowest version of VS Code to support

## 0.0.37

- `oneapi-cli` download action verfies with SHA384
- Bump devel-dependencies

## 0.0.36

- Increase minimum required `oneapi-cli` version
- Bump devel-dependencies

## 0.0.35

- Add link to documentation and video
- Bump devel-dependencies

## 0.0.34

- Update oneAPI logos

## 0.0.33

- First non-preview release
- Added tags to manifest for discoverability in marketplace

## 0.0.32

- Fix issue when a response from the CLI is empty, this was treated as an error. This means on macOS, the whole tree would fail because at the time of reporting, there was no Python samples on macOS

##  0.0.31

- Remove action when selecting a sample where it would then display the README
- Add inline action to open the README on the provided URL instead
- Shows both cpp and python samples in the tree by default
- Fix bug when trying to create sample in non cpp language. Requires oneapi-cli v0.0.15

##  0.0.30

- Update Logo

##  0.0.29

- Initial release