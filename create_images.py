import os, itertools
if __name__ == "__main__":
  puml_files = []
  for (root, _ ,files) in os.walk("./diagrams"):
    puml_files.append([f"{root}/{file}" for file in files if file.endswith(".puml")])

  # Use unpacking to flatten list of lists
  for file in list(itertools.chain(*puml_files)):
    print(f"Creating image for {file}")
    os.system(f"java -jar plantuml.jar {file}")
    print(f"Finished creating image for {file}")
  
  print("All image files created")
    