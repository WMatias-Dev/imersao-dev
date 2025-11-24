# MicroBioBase 🔬


**MicroBioBase** é uma enciclopédia web interativa e de código aberto dedicada à microbiologia. Reúne informações confiáveis sobre microrganismos e antibióticos em um ambiente rápido, responsivo e fácil de usar, apoiando estudantes, professores e profissionais da saúde no acesso ao conhecimento científico.

---

## 🌟 Principais Funcionalidades

*   **Base de Dados Local**: Todas as informações são carregadas a partir de um arquivo `data.json`, tornando a aplicação autônoma e fácil de modificar.
*   **Busca em Tempo Real**: Filtre os cards instantaneamente por nome, classificação, morfologia e outras características.
*   **Filtragem por Categorias**: Navegue facilmente entre Gram-positivos, Gram-negativos, Fungos, Bactérias e Antibióticos.
*   **Painel de Detalhes**: Visualize informações completas, incluindo mecanismos de resistência e tabelas de breakpoints (S/I/R), sem sair da página.
*   **Sistema de Favoritos**: Salve seus itens de interesse para acesso rápido. Os favoritos são salvos localmente no seu navegador.
*   **Tema Claro e Escuro**: Alterne entre os temas para melhor conforto visual. Sua preferência é salva para visitas futuras.
*   **Design Responsivo**: A interface se adapta perfeitamente a desktops, tablets e dispositivos móveis.
*   **Exportar Favoritos para Imagem**: Gere uma imagem JPG com um design elegante contendo todos os seus cards favoritados, ideal para compartilhamento e estudo.
*   **Visualizador de Imagens com Zoom**: Clique em qualquer imagem para abri-la em um modal com funcionalidade de zoom (scroll do mouse).

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando tecnologias web padrão, sem a necessidade de frameworks complexos, focando em performance e simplicidade.

*   **HTML5**: Estrutura semântica e acessível.
*   **CSS3**: Estilização moderna com:
    *   **CSS Variables**: Para um sistema de temas (claro/escuro) dinâmico.
    *   **Flexbox & Grid Layout**: Para a criação de layouts responsivos e robustos.
*   **JavaScript (ES6+)**: Lógica da aplicação, incluindo:
    *   **Vanilla JS**: Sem dependências de frameworks como React ou Vue.
    *   **Async/Await**: Para carregamento assíncrono dos dados.
    *   **Manipulação do DOM**: Para renderização dinâmica dos componentes.
    *   **LocalStorage API**: Para persistência do tema e dos favoritos.
*   **JSON**: Utilizado como um banco de dados local para armazenar as informações dos microrganismos.
*   **html2canvas**: Biblioteca externa utilizada para a funcionalidade de exportar os cards para uma imagem.

---

## 🚀 Como Executar o Projeto

Como este é um projeto front-end estático, você não precisa de ferramentas de compilação ou processos complexos. A maneira mais fácil de executá-lo é através de um servidor web local.

### Pré-requisitos

*   Um navegador web moderno (Chrome, Firefox, Edge, etc.).
*   (Opcional, mas recomendado) Python 3 ou Node.js instalado para rodar um servidor local.

### Passos para Execução

1.  **Clone ou baixe o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/microbiobase.git
    cd microbiobase
    ```
    *Substitua `seu-usuario/microbiobase.git` pelo URL do seu repositório.*

2.  **Inicie um servidor web local:**
    A aplicação precisa ser servida por um servidor HTTP para que a função `fetch()` consiga carregar o arquivo `data.json` corretamente (protocolos `file://` são restritos por segurança).

    *   **Se você tem Python 3:**
        ```bash
        python -m http.server
        ```

    *   **Se você tem Node.js (e npm):**
        Primeiro, instale o `http-server` globalmente (apenas uma vez):
        ```bash
        npm install -g http-server
        ```
        Depois, inicie o servidor:
        ```bash
        http-server
        ```

3.  **Acesse no navegador:**
    Abra seu navegador e acesse o endereço fornecido pelo servidor, que geralmente é:
    http://localhost:8000 ou http://localhost:8080

E pronto! A aplicação estará funcionando.

---

## 🤝 Como Contribuir

Contribuições são bem-vindas! Se você tem sugestões de melhorias, novos microrganismos para adicionar ou encontrou algum bug, sinta-se à vontade para abrir uma *Issue* ou enviar um *Pull Request*.

1.  Faça um *fork* do projeto.
2.  Crie uma nova *branch* (`git checkout -b feature/nova-funcionalidade`).
3.  Faça suas alterações e *commits* (`git commit -m 'Adiciona nova funcionalidade'`).
4.  Envie para a sua *branch* (`git push origin feature/nova-funcionalidade`).
5.  Abra um *Pull Request*.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
