const { setPrompt, processPrompt } = require('../openAI-gateway/OpenAIManager');
const FileArchPromptGenerator = require('../chat-module/prompts/FileArchPromptGenerator');
const ResponseParser = require('../chat-module/ResponseParser');
const ProjectFileManager = require('../file-architecture/ProjectFileManager');
const DocumentGenerator = require('../code-documentation/DocumentGenerator');
const Document = require('../code-documentation/Document');
const DocumentFieldManager = require('../code-documentation/DocumentFieldManager');
const PDFGenerator = require('../code-documentation/PDFGenerator');
const DocxGenerator = require('../code-documentation/DocxGenerator');
const MarkdownGenerator = require('../code-documentation/MarkdownGenerator');
const path = require('path');


class VSCodeController {
    constructor() {
      this.highlightedCode = "";
      this.projectFileManager = new ProjectFileManager();
    }
  
    getHighlightedCode(req, res) {
      this.highlightedCode = req.body.highlightedCode;
      console.log("Highlighted text received:", this.highlightedCode);
      res.status(200).send(this.highlightedCode);
    }

    getProjectPath(req, res) {
      const projectPath = req.body.projectPath; 
      if (!projectPath) {
        console.error("Project path not provided");
        return res.status(400).send("Project path is required");
      }
      console.log("Project path received:", projectPath);
      console.log(res);
      res.status(200).send(projectPath);
    }
  
    async generateProjectStructure(req, res) {
      const projectDetails = req.body;
      console.log("Project details received:", projectDetails);
  
      try {
        const projectStructure = await this.projectFileManager.generateProjectStructure(projectDetails);
        res.status(200).send(projectStructure);
      } catch (error) {
        console.error("Error generating project structure:", error);
        res.status(500).send("Error generating project structure");
      }
    }
  
    async generateDocumentation(req, res) {
      const { fields, format } = req.body; 
      if (!fields || !format) {
        return res.status(400).send("Fields and format are required");
      }
      //const projectPath = this.getProjectPath(req);
      const projectPath = "D:\\praxis-am-ring-server";
    
      const fieldManager = new DocumentFieldManager();
      fields.forEach(field => fieldManager.addField(field));

      console.log("Fields received:", fields);
      console.log("Format received:", format);
      console.log("Project path received:", projectPath);
    
      
      const documentGenerator = new DocumentGenerator();
      const document = new Document();
      
      try {
        for (const field of fieldManager.getFields()) {
          const content = await documentGenerator.generateContent(projectPath, [field]);
          document.setContent(field, content);
        }
        
        console.log("Document content generated:", document);
        const filename = path.join(projectPath, `documentation.${
          // switch pdf, docx, md
          format === 'pdf' ? 'pdf' : format === 'docx' ? 'docx' : 'md'
        }`);
        if (format === 'pdf') {
            const pdfGenerator = new PDFGenerator();
            for (const [field, content] of Object.entries(document.getContent())) {
                pdfGenerator.addMarkdownContent(content);
            }
           
            await pdfGenerator.generate(document, filename);
            res.status(200).send({ message: `PDF documentation generated successfully at ${filename}` });
        } else if (format === 'docx') {
            const docxGenerator = new DocxGenerator();
            for (const [field, content] of Object.entries(document.getContent())) {
                docxGenerator.addMarkdownContent(content);
            }
            await docxGenerator.generate(document, filename);
          
            res.status(200).send({ message: `DOCX documentation generated successfully at ${filename}` });
        }
        else if (format === 'md') {
            const markdownGenerator = new MarkdownGenerator();
            for (const [field, content] of Object.entries(document.getContent())) {
                markdownGenerator.addMarkdownContent(content);
            }
            await markdownGenerator.generate(document, filename);
            res.status(200).send({ message: `Markdown documentation generated successfully at ${filename}` });
        }
       
      } catch (error) {
        console.error("Error generating documentation:", error);
        res.status(500).send("Error generating documentation");
      }
    }


  }
  
  module.exports = VSCodeController;