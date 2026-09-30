import { getDoctorDirectory } from '../../../lib/static-data';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const doctor = getDoctorDirectory().find((d) => d.id === id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    return res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor'
    });
  }
}
