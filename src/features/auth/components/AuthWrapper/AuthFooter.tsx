/**
 * Node modules
 */
import { Flex, Typography } from 'antd';

const { Link, Text } = Typography;

export const AuthFooter = () => {
  return (
    <footer className='mx-auto w-full max-w-7xl px-4 py-8'>
      <Flex
        justify='space-between'
        align='center'
        wrap='wrap'
        gap={16}
      >
        <Flex
          align='center'
          gap={8}
        >
          <Text className='text-gray'>© Made with love by Team</Text>
          <Link href='https://codedthemes.com'>CodedThemes</Link>
        </Flex>
        <Flex
          align='center'
          gap={16}
        >
          <Link href='#'>Terms and Conditions</Link>
          <Link href='#'>Privacy Policy</Link>
        </Flex>
      </Flex>
    </footer>
  );
};
