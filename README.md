# About

Truth often implies a sense of objectiveness despite its ability of being highly subjective. What an individual considers to be true is the result of a decision making process involving societal context and personal experience. The transformative nature of both facilitates an understanding of truth as a fluid construct with the ability to evolve. Combining many of these singular impressions into one might reveal an unseen artifact somewhere in between subjectiveness and objectivity.

# Prerequisites

- Tested only using Windows 10 on a system with the following specs:

  - CPU: 11th Gen Intel i9-11900K @3.50GHz
  - GPU: NVIDIA RTX 3080 (10GB)
  - RAM: 32GB @3200MHz
  - Available Storage: 30GB Free
    - HGHub caches dataset on C:\ drive regardess of where you install this application
    - Due to the nature of this application, the size is incereasing slowly over time

- Install Cuda 11.8<br>
  [Download from NVIDIA](https://developer.nvidia.com/cuda-11-8-0-download-archive)

# Env Setup

- create a file called '.env.development.local' in the root directory of the project
- add the following to the file:

```shell
GITHUB_TOKEN=pasteyourtokenhereforautorelease
INCLUDE_BACKEND=true or false can be used to make quick testbuild including only the frontend
```

- Create & Activate venv (naming convention is important for devmode)

```shell
python -m venv .env && .\.env\Scripts\activate
```

- Install Requirements

```shell
pip install -r requirements.txt
```

- Install NPM Packages

```shell
npm install
```
