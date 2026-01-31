import { Helmet } from 'react-helmet-async';

type SeoProps = {
  title: string;
  description?: string;
  keywords?: string;
};

export const Seo = ({ title, description, keywords }: SeoProps) => {
  return (
    <Helmet>
      <title>{title} | Your App Name</title>
      {description && (
        <meta
          name='description'
          content={description}
        />
      )}
      {keywords && (
        <meta
          name='keywords'
          content={keywords}
        />
      )}
    </Helmet>
  );
};
