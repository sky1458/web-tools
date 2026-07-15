import { Link, Outlet } from 'umi';
import { Layout, Menu, theme } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse } from '@fortawesome/free-solid-svg-icons';
import styles from './index.less';

const { Header, Content } = Layout;

export default function Root() {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  return (
    <Layout>
      <Header className={styles.header}>
        <div className={styles.icon}>
          <FontAwesomeIcon
            icon={faHouse}
            style={{ color: 'white', fontSize: 24 }}
          />
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['qrcode']}
          style={{ flex: 1, minWidth: 0 }}
        >
          <Menu.Item key="qrcode">
            <Link to="/">微信二维码生成</Link>
          </Menu.Item>
          <Menu.Item key="docs">
            <Link to="/docs">文档</Link>
          </Menu.Item>
        </Menu>
      </Header>
      <Content>
        <div style={{ background: colorBgContainer }}>
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
}
