import jwt from 'jsonwebtoken';
import PortalContractService from './portal-contract.service.js';

const JWT_SECRET = process.env.JWT_SECRET;

class PortalContractController {

  async getByToken(req, res) {
    try {
      const result = await PortalContractService.getByToken(req.params.token);
      res.status(200).json({ message: 'Contract found', contract: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async verifyEmail(req, res) {
    try {
      const { email } = req.body || {};
      const result = await PortalContractService.verifyEmail(req.params.token, email);
      res.status(200).json({ message: 'Email verified', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async requireContractAuth(req, res, next) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'Missing contract token.' });

      const payload = jwt.verify(token, JWT_SECRET);
      if (payload.scope !== 'contract_send') {
        return res.status(403).json({ message: 'Wrong token scope.' });
      }
      req.offerSendId = payload.offer_send_id;
      next();
    } catch {
      return res.status(403).json({ message: 'Invalid or expired contract token.' });
    }
  }

  async getContract(req, res) {
    try {
      const result = await PortalContractService.getContract(req.params.token, req.offerSendId);
      res.status(200).json({ message: 'Contract fetched', contract: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async downloadDocument(req, res) {
    try {
      const format = typeof req.query.format === 'string' ? req.query.format.toLowerCase() : null;
      const info = await PortalContractService.getDownloadInfo(req.params.token, req.offerSendId, format);

      res.set('Access-Control-Expose-Headers', 'Content-Disposition');

      if (info.kind === 'buffer') {
        res.setHeader('Content-Type', info.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${info.fileName}"`);
        return res.send(info.buffer);
      }

      res.download(info.filePath, info.fileName, (err) => {
        if (err && !res.headersSent) {
          console.error('Error in downloadDocument (res.download):', err);
          res.status(500).json({ message: 'Failed to download the contract letter.' });
        }
      });
    } catch (err) {
      console.error('Error in downloadDocument:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async upload(req, res) {
    try {
      const result = await PortalContractService.uploadCandidateFile(req.params.token, req.offerSendId, req.file);
      res.status(200).json({ message: 'File uploaded', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async submit(req, res) {
    try {
      const result = await PortalContractService.submit(req.params.token, req.offerSendId);
      res.status(200).json({ message: 'Contract submitted successfully', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new PortalContractController();