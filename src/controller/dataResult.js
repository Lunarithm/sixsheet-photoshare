
import Medias from '../model/medias.js'

async function getUUID(shortUUID) {
    try{
    const customerResult = await Medias.findOne({ where: { shortUUID: shortUUID },attributes: ['source'] }) 
    if (customerResult) {
        res.status(200).json(customerResult);
      } else {
        res.status(404).json({ message: 'No data found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

export default getUUID;