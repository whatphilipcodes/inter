import os

# TOOL SETTINGS #################################################
IN_MODEL = os.path.join("resources_dev", "models_tuned", "pythia-tok-mod")
IN_DATA = os.path.join("resources_dev", "data_sets", "novelist")
OUT_MODEL = os.path.join("resources_dev", "models_tuned", "inter-generator")
#################################################################


def main() -> None:
    print("Hello World!")


if __name__ == "__main__":
    main()
