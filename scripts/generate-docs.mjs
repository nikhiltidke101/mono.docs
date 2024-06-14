import * as OpenAPI from 'fumadocs-openapi';
 
void OpenAPI.generateFiles({
  input: ['./openapi/*.yaml'],
  output: './content/',
  per: 'tag',
  render: (title, description) => {
    return {
      frontmatter: [
        '---',
        `title: ${title}`,
        `description: ${description}`,
        'toc: false',
        '---',
      ].join('\n'),
    };
  },
});