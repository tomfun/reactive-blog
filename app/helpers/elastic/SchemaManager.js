class SchemaManager {
  /**
   * @param {ElasticManager} em
   */
  constructor(em) {
    this.em = em;
  }

  createTypes() {
    const client = this.em.client;
    return Promise.all(this.em.entityMetas.map(function (md) {
      return md.existType(client).then(function (d) {
        return d ? md.putType(client) : md.createType(client);
      }).catch(function (e) {
        console.error(e, e.stack);
      });
    }));
  }
}

export default SchemaManager;
