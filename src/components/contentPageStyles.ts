import contentPage from './ContentPage.module.css';
import formSections from './FormSections.module.css';

/**
 * The styles of the pre-built content pages. The server build draws those
 * pages, so the calculator never imports their components; the page script
 * references this list so the bundler keeps their styles.
 */
export const contentPageStyles = [contentPage, formSections];
