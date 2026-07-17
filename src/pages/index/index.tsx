import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'umi';
import { faQrcode, faHockeyPuck } from '@fortawesome/free-solid-svg-icons';
import { faEmpire } from '@fortawesome/free-brands-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

import { invertColor } from '@/utils/colorTint';

import routes from '../../../config/routes';

import styles from './index.less';

const CustomCard = ({
  name,
  color = '#041428',
  onClick,
  icon,
}: {
  name: string;
  onClick: React.MouseEventHandler<HTMLDivElement>;
  color?: string;
  icon: IconProp;
}) => {
  const fg = invertColor(color);
  return (
    <div
      className={styles.nav}
      onClick={onClick}
      style={{
        background: color,
      }}
    >
      <div className={styles.icon}>
        <FontAwesomeIcon icon={icon} style={{ fontSize: 60, color: fg }} />
      </div>
      <div className={styles.title} style={{ color: fg }}>
        {name}
      </div>
    </div>
  );
};

const getIcon = (path: string) => {
  switch (path) {
    case '/qrcode':
      return faQrcode;
    case '/lottery':
      return faEmpire;
    default:
      return faHockeyPuck;
  }
};

const navs = routes
  .filter((route) => route.path !== '/')
  .map((route) => ({
    key: route.path,
    title: route.name,
    icon: getIcon(route.path),
  }));

const IndexPage = () => {
  const navgate = useNavigate();
  return (
    <div className={styles.wrapper}>
      {navs.map((nav) => (
        <CustomCard
          key={nav.key}
          name={nav.title}
          icon={nav.icon}
          onClick={() => navgate(nav.key)}
        />
      ))}
    </div>
  );
};

export default IndexPage;
