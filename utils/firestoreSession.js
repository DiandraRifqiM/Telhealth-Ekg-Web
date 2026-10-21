const session = require("express-session");

class FirestoreSessionStore extends session.Store {
  constructor({ db, collection = "sessions", ttlMs = 60 * 60 * 1000 }) {
    super();

    this.collection = db.collection(collection);
    this.ttlMs = ttlMs;
  }

  getExpiry(sess) {
    const expires = sess.cookie?.expires;

    if (expires) {
      return new Date(expires);
    }

    const maxAge = sess.cookie?.originalMaxAge;

    return new Date(
      Date.now() + (typeof maxAge === "number" ? maxAge : this.ttlMs)
    );
  }

  async get(sid, callback) {
    try {
      const doc = await this.collection.doc(sid).get();

      if (!doc.exists) {
        return callback(null, null);
      }

      const record = doc.data();

      if (record.expiresAt.toDate() <= new Date()) {
        await doc.ref.delete();
        return callback(null, null);
      }

      return callback(null, record.data);
    } catch (error) {
      return callback(error);
    }
  }

  async set(sid, sess, callback) {
    try {
      const expiresAt = this.getExpiry(sess);

      // Buat objek session biasa yang bisa disimpan Firestore
      const sessionData = JSON.parse(JSON.stringify(sess));

      await this.collection.doc(sid).set({
        data: sessionData,
        expiresAt,
      });

      if (callback) callback(null);
    } catch (error) {
      if (callback) return callback(error);
      throw error;
    }
  }

  async destroy(sid, callback) {
    try {
      await this.collection.doc(sid).delete();

      if (callback) callback(null);
    } catch (error) {
      if (callback) return callback(error);
    }
  }

  async touch(sid, sess, callback) {
    try {
      const expiresAt = this.getExpiry(sess);

      // Ubah Session menjadi objek JSON biasa
      const sessionData = JSON.parse(JSON.stringify(sess));

      await this.collection.doc(sid).update({
        data: sessionData,
        expiresAt,
      });

      if (callback) callback(null);
    } catch (error) {
      if (callback) return callback(error);
      throw error;
    }
  }
}

module.exports = { FirestoreSessionStore };
