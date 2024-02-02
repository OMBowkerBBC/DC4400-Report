import itertools, os, sys

if __name__ == "__main__":
  removeImages: bool = sys.argv[1] == '--remove-images'
  puml_files: [str] = []
  png_files: [str] = []

  for (root, _ ,files) in os.walk("./diagrams"):
    puml_files.append([f"{root}/{file}" for file in files if file.endswith(".puml")])
    png_files.append([f"{root}/{file}" for file in files if file.endswith(".png")])

  if removeImages:
    print("Removing all images...")
    for file in list(itertools.chain(*png_files)):
      os.remove(file)
  

  # Use unpacking to flatten list of lists
  for file in list(itertools.chain(*puml_files)):
    print(f"Creating image for {file}")
    os.system(f"java -jar plantuml.jar {file}")
    print(f"Finished creating image for {file}")
  
  print("All image files created")
    