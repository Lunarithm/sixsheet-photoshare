import { Sequelize } from 'sequelize'

const sequelize = new Sequelize('postgresql://doadmin:AVNS_yqbAKywnht18sdKZ3BB@sixsheet-postgres-do-user-10822787-0.b.db.ondigitalocean.com:25060/sixsheet?sslmode=no-verify');

export default sequelize;
