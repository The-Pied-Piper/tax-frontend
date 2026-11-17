import styles from './ContentPage.module.css';
import type { ContentBlock } from '../state/contentPages';

/** The blocks of a content page section, each drawn as real elements from plain data. */
export function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <>
      {blocks.map((block, at) => {
        switch (block.kind) {
          case 'subheading':
            return (
              <h3 key={at} className={styles.subheading}>
                {block.text}
              </h3>
            );
          case 'list':
            return (
              <ul key={at} className={styles.list}>
                {block.items.map((item) => (
                  <li key={item.label}>
                    {item.href ? (
                      <a href={item.href}>{item.label}</a>
                    ) : (
                      <span className={styles.name}>{item.label}</span>
                    )}
                    {item.text && <p>{item.text}</p>}
                  </li>
                ))}
              </ul>
            );
          case 'links':
            return (
              <nav key={at} aria-label={block.label}>
                <ul
                  className={block.layout === 'grid' ? styles.grid : styles.row}
                >
                  {block.links.map((link) => (
                    <li key={link.href}>
                      <a href={link.href}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            );
          case 'table':
            return (
              <table key={at} className={styles.table}>
                <caption>{block.caption}</caption>
                <thead>
                  <tr>
                    {block.columns.map((column) => (
                      <th key={column} scope="col">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, line) => (
                    <tr key={line}>
                      {row.map((cell, column) => (
                        <td key={column}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
        }
      })}
    </>
  );
}
