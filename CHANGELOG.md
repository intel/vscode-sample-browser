# Change Log

## 0.0.32

- Fix issue when a response from the CLI is empty, this was treated as an error. This mean on Mac OS, the whole tree would fail beacuse at the time of reporting, there was no Python samples on Mac OS

##  0.0.31

- Remove action when selecting a sample where it would then display the README.
- Add inline action to open the README on the provided URL instead.
- Shows both cpp and python samples in the tree by default
- Fix bug when trying to create sample in non cpp language. Requires oneapi-cli v0.0.15

##  0.0.30

- Update Logo

##  0.0.29

- Initial release