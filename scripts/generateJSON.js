const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const folder = path.join(__dirname, '../conteudos/recursos');
const outputFile = path.join(__dirname, '../conteudos/recursos.json');

const files = fs.readdirSync(folder).filter(f => f.endsWith('.md'));
const artigos = files.map(file => {
  const content = fs.readFileSync(path.join(folder, file), 'utf8');
  const { data, content: body } = matter(content);
  return {
    title: data.title,
    summary: data.summary || "",
    body: body.trim(),
    full_content: data.full_content || false,
    slug: file.replace('.md', '')
  };
});

fs.writeFileSync(outputFile, JSON.stringify(artigos, null, 2));
console.log("JSON atualizado com sucesso!");
