const express = require('express');
const router = express.Router();
const ctrl = require('../controller/adminController');
const adminAuth = require('../middleware/adminAuth');
const { upload } = require('../utils/s3');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);

router.use(adminAuth);

router.get('/stats', ctrl.getDashboardStats);

router.get('/users', ctrl.listUsers);
router.get('/users/:id', ctrl.getUser);
router.patch('/users/:id/activate', ctrl.activateUser);
router.patch('/users/:id/deactivate', ctrl.deactivateUser);
router.delete('/users/:id', ctrl.deleteUser);

router.get('/plans', ctrl.listPlans);
router.post('/plans', ctrl.createPlan);
router.patch('/plans/:id', ctrl.updatePlan);
router.delete('/plans/:id', ctrl.deletePlan);

router.get('/ads-reports', ctrl.listAdsReports);
router.post('/ads-reports', ctrl.createAdsReport);
router.patch('/ads-reports/:id', ctrl.updateAdsReport);
router.delete('/ads-reports/:id', ctrl.deleteAdsReport);

router.get('/leads', ctrl.listLeads);
router.get('/leads/:leadId/notes', ctrl.getLeadNotes);

router.get('/services', ctrl.listServices);
router.post('/services', ctrl.createService);
router.patch('/services/:id', ctrl.updateService);
router.delete('/services/:id', ctrl.deleteService);
router.get('/videos', ctrl.listVideos);
router.post('/videos', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), ctrl.createVideo);
router.patch('/videos/:id', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), ctrl.updateVideo);
router.delete('/videos/:id', ctrl.deleteVideo);
router.get('/testimonials', ctrl.listTestimonials);
router.post('/testimonials', ctrl.createTestimonial);
router.patch('/testimonials/:id', ctrl.updateTestimonial);
router.delete('/testimonials/:id', ctrl.deleteTestimonial);

module.exports = router;
