import Folder from '../models/Folder.js';

export const ensureDefaultFolders = async (userId) => {
  let hello = await Folder.findOne({ userId, name: 'Hello', parentFolderId: null });
  if (!hello) {
    hello = await Folder.create({ userId, name: 'Hello', parentFolderId: null });
  }

  let subHello = await Folder.findOne({ userId, name: 'SubHello', parentFolderId: hello._id });
  if (!subHello) {
    subHello = await Folder.create({ userId, name: 'SubHello', parentFolderId: hello._id });
  }

  return { hello, subHello };
};
