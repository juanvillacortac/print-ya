export default `<!DOCTYPE html>
<html lang="en">
  <body>
    <style>
      /** scrollbar style **/
      *::-webkit-scrollbar {
        background: transparent;
        width: 6px;
        height: 6px;
      }

      *::-webkit-scrollbar-thumb {
        transition: background 0.2s ease-in-out;
        background: transparent;
        border-radius: 9999px;
      }

      *::-webkit-scrollbar-corner {
        background: transparent;
      }

      *:hover::-webkit-scrollbar-thumb {
        background-color: rgba(156, 163, 175, 0.7);
      }
      .dark *:hover::-webkit-scrollbar-thumb {
        background-color: #333;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        background: transparent;
        width: 100%;
        height: 100%;
        overflow: overlay;
      }
      body {
        padding: 12px;
      }
      #container {
        pointer-events: none;
        user-select: none;
      }
    </style>
    <div id="container"></div>
    <script>
      let styleEl, fixedStyleEl
      const container = document.getElementById('container')

      window.addEventListener(
        'message',
        (e) => {
          const { css, fixedCss, classes, html } = JSON.parse(e.data)

          // console.log({
          //   css,
          //   fixedCss,
          //   classes,
          // })

          if (css != null) {
            if (styleEl) document.body.removeChild(styleEl)
            styleEl = document.createElement('style')
            styleEl.innerHTML = css
            document.body.appendChild(styleEl)
          }

          if (fixedCss != null) {
            if (fixedStyleEl) document.body.removeChild(fixedStyleEl)
            fixedStyleEl = document.createElement('style')
            fixedStyleEl.innerHTML = fixedCss
            document.body.appendChild(fixedStyleEl)
          }

          if (classes != null) container.className = classes
          if (html != null) container.innerHTML = html
        },
        false
      )
    </script>
  </body>
</html>`
