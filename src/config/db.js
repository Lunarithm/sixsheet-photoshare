import { Sequelize } from 'sequelize'

const sequelize = new Sequelize('postgresql://doadmin:AVNS_XopmdTy8f8fFg-4b2m5@sixsheet-photoshare-db-do-user-10822787-0.d.db.ondigitalocean.com:25060/photoshare?sslmode=no-verify');

export default sequelize;
