/**
 * Node modules
 */
import { Helmet } from 'react-helmet-async';

/**
 * Types
 */
type SeoProps = {
  title: string;
  description?: string;
  name?: string;
  type?: string;
};

export const Seo = ({
  title,
  description,
  name = 'CAMS',
  type = 'article',
}: SeoProps) => (
  <Helmet>
    {/* Standard metadata tags */}
    <title>{`${title} | ${name}`}</title>
    <meta
      name='description'
      content={description}
    />
    {/* Facebook tags */}
    <meta
      property='og:type'
      content={type}
    />
    <meta
      property='og:title'
      content={title}
    />
    <meta
      property='og:description'
      content={description}
    />
  </Helmet>
);
