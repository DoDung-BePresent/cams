import { Flex, Layout, Typography } from 'antd';

const { Text, Link } = Typography;
const { Footer } = Layout;

export const AppFooter = () => {
  return (
    <Footer
      style={{
        background: '#121212',
        borderTop: '1px solid #282828',
        padding: '24px 32px',
      }}
    >
      <Flex
        align='center'
        justify='space-between'
      >
        <Flex>
          <Text style={{ color: '#b3b3b3', fontSize: 13 }}>
            CAMS ©{new Date().getFullYear()} Created by CAMS - FPT University
          </Text>
        </Flex>
        <Flex gap={24}>
          <Link
            href='#'
            style={{ color: '#1db954', fontSize: 13, fontWeight: 500 }}
          >
            Terms and Conditions
          </Link>
          <Link
            href='#'
            style={{ color: '#1db954', fontSize: 13, fontWeight: 500 }}
          >
            Privacy Policy
          </Link>
          <Link
            href='#'
            style={{ color: '#1db954', fontSize: 13, fontWeight: 500 }}
          >
            Help
          </Link>
        </Flex>
      </Flex>
    </Footer>
  );
};
