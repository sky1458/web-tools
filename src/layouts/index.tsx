import { Link, Outlet, useLocation } from 'umi';
import { Layout, Menu, theme, Affix } from 'antd';

import routes from '../../config/routes';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse } from '@fortawesome/free-solid-svg-icons';
import styles from './index.less';

const { Header, Content } = Layout;

export default function Root() {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const { pathname } = useLocation();

  const items = routes
    .filter((route) => route.path !== '/')
    .map((route) => ({
      key: route.path,
      title: route.name,
      label: <Link to={route.path}>{route.name}</Link>,
    }));

  return (
    <Layout>
      <Affix>
        <Header className={styles.header}>
          <div className={styles.icon}>
            <Link to="/">
              <FontAwesomeIcon
                icon={faHouse}
                style={{ color: 'white', fontSize: 24 }}
              />
            </Link>
          </div>
          <Menu
            theme="dark"
            mode="horizontal"
            style={{ flex: 1, minWidth: 0 }}
            selectedKeys={[pathname]}
            items={items}
          />
        </Header>
      </Affix>
      <Content>
        <div style={{ background: colorBgContainer }}>
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
}
