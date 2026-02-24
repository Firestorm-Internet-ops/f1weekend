<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
  version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"
  exclude-result-prefixes="sm"
>
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>XML Sitemap — F1 Weekend</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #0f0f17;
            color: #e2e8f0;
            min-height: 100vh;
          }

          header {
            background: linear-gradient(135deg, #6d28d9 0%, #2563eb 100%);
            padding: 2.5rem 2rem;
          }

          header h1 {
            font-size: 2rem;
            font-weight: 700;
            color: #fff;
            margin-bottom: 0.4rem;
          }

          header p {
            color: rgba(255,255,255,0.8);
            font-size: 0.95rem;
            max-width: 640px;
            line-height: 1.5;
          }

          .stats {
            display: flex;
            gap: 1.5rem;
            padding: 1.25rem 2rem;
            background: #1a1a2e;
            border-bottom: 1px solid #2d2d4e;
            flex-wrap: wrap;
          }

          .stat {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
            color: #94a3b8;
          }

          .stat strong {
            color: #e2e8f0;
            font-weight: 600;
          }

          .stat-icon {
            font-size: 1.1rem;
          }

          .container {
            padding: 1.5rem 2rem;
            overflow-x: auto;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
          }

          thead tr {
            background: #1a1a2e;
            border-bottom: 2px solid #2d2d4e;
          }

          th {
            padding: 0.75rem 1rem;
            text-align: left;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            white-space: nowrap;
          }

          tbody tr {
            border-bottom: 1px solid #1e1e30;
            transition: background 0.15s;
          }

          tbody tr:hover {
            background: #1a1a2e;
          }

          td {
            padding: 0.75rem 1rem;
            vertical-align: middle;
          }

          .num {
            color: #475569;
            font-size: 0.8rem;
            width: 3rem;
          }

          .url-cell a {
            color: #60a5fa;
            text-decoration: none;
            word-break: break-all;
          }

          .url-cell a:hover {
            text-decoration: underline;
            color: #93c5fd;
          }

          .date {
            color: #64748b;
            font-size: 0.8rem;
            white-space: nowrap;
          }

          footer {
            padding: 1.5rem 2rem;
            text-align: center;
            color: #475569;
            font-size: 0.8rem;
            border-top: 1px solid #1e1e30;
          }

          footer a {
            color: #6d28d9;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <header>
          <h1>&#x1F5FA; XML Sitemap</h1>
          <p>This sitemap contains all the URLs for F1 Weekend — the ultimate guide for Australian Grand Prix 2026 in Melbourne.</p>
        </header>

        <div class="stats">
          <div class="stat">
            <span class="stat-icon">&#x1F517;</span>
            <span>Total URLs: <strong><xsl:value-of select="count(sm:urlset/sm:url)"/></strong></span>
          </div>
          <div class="stat">
            <span class="stat-icon">&#x1F4C5;</span>
            <span>Last Updated: <strong><xsl:value-of select="sm:urlset/sm:url[1]/sm:lastmod"/></strong></span>
          </div>
          <div class="stat">
            <span class="stat-icon">&#x1F30F;</span>
            <span>Site: <strong>f1weekend.co</strong></span>
          </div>
        </div>

        <div class="container">
          <table>
            <thead>
              <tr>
                <th class="num">#</th>
                <th>URL</th>
                <th>LAST MODIFIED</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sm:urlset/sm:url">
                <tr>
                  <td class="num"><xsl:value-of select="position()"/></td>
                  <td class="url-cell">
                    <a href="{sm:loc}" target="_blank" rel="noopener noreferrer">
                      <xsl:value-of select="sm:loc"/>
                    </a>
                  </td>
                  <td class="date"><xsl:value-of select="sm:lastmod"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>

        <footer>
          Generated by <a href="https://f1weekend.co" target="_blank" rel="noopener noreferrer">f1weekend.co</a>
          &#x2022; Sitemap protocol: <a href="https://www.sitemaps.org/protocol.html" target="_blank" rel="noopener noreferrer">sitemaps.org</a>
        </footer>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
