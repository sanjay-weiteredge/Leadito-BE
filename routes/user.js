const express = require('express');
const router = express.Router();
const ctrl = require('../controller/userController');
const userAuth = require('../middleware/userAuth');
const isPaid = require('../middleware/isPaid');

router.get('/plans', ctrl.getPlans);
router.get('/services', ctrl.listServices);
router.get('/videos', ctrl.listVideos);
router.get('/testimonials', ctrl.listTestimonials);
router.get('/settings', ctrl.getSettings);

router.use(userAuth);

const { upload } = require('../utils/s3');

router.get('/user/profile', ctrl.getProfile);
router.put('/user/profile', upload.single('logo'), ctrl.updateProfile);
router.post('/user/onboard', upload.single('logo'), ctrl.onboardUser);

router.get('/ads-results', ctrl.getAdsResults);

router.use('/leads', isPaid);

router.get('/leads', ctrl.listLeads);
router.post('/leads', ctrl.createLead);
router.patch('/leads/:id', ctrl.updateLead);
router.delete('/leads/:id', ctrl.deleteLead);
router.get('/leads/:id/notes', ctrl.getLeadNotes);
router.post('/leads/:id/notes', ctrl.addLeadNote);
router.patch('/leads/notes/:noteId', ctrl.updateLeadNote);
router.delete('/leads/notes/:noteId', ctrl.deleteLeadNote);

const notifCtrl = require('../controller/notificationController');

router.get('/notifications', notifCtrl.listNotifications);
router.patch('/notifications/read-all', notifCtrl.markAllAsRead);
router.patch('/notifications/:id/read', notifCtrl.markAsRead);

module.exports = router;
