# Portfolio 
This repository contains the plans for my project.

### Latex
The report is written using LaTeX. A PDF file is included in the repo, however if you want to re-render it you should run:

`pdflatex main.tex`

### Plant UML
Some images in the report are created using plantUML. For the sake of ease I have included the `.jar` file in this repo however you can also download it from https://plantuml.com/ where there are some great 'Getting Started' guides :).

Some of the images are not included in the repo and can be generated using the following commands:

#### _For a single file_
`java -jar plantuml.jar -verbose {file}.puml`

#### _For all files_
**Yes this script uses `os.system`, which is very insecure. But don't panic it's just running plantUML and was made as a quick fix to recreate all images!**

`python create_images.py`
