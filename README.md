# Prerequisites

- Tested only on a Windows 10 System with the following specs:

  - CPU: 11th Gen Intel i9-11900K @3.50GHz
  - GPU: NVIDIA RTX 3080 (10GB)
  - RAM: 32GB @3200MHz
  - Available Storage: 30GB Free
    - HGHub caches dataset on C:\ drive regardess of where you install this application
    - Due to the nature of this application, the size is incereasing slowly over time

- Install Cuda 11.8<br>
  [Download from NVIDIA](https://developer.nvidia.com/cuda-11-8-0-download-archive)

# Env Setup

- Create & Activate venv

```shell
python -m venv .env && .\.env\Scripts\activate
```

- Install Requirements

```shell
pip install -r requirements.txt
```

- Install Yarn Packages

```shell
yarn install
```
