const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const schoolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    schoolId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    state:{
        type: String,
        required: true,
        trim: true
    },
    storeTrainingData:{
        type: Boolean,
        default: false,
    },
    autoSync: { 
        type: Boolean,
        required: false
    },
    autoSyncFrequency: {
        type: Number,
        required: false,
        default: 600000
    },
    tags: { 
        type: Boolean,
        required: false
    },
    autoSyncBatchSize:{
        type: Number,
        required: false
    },
    
    isMinimalMode: { 
        type: Boolean,
        required: false
    },
    supportEmail:{
        type: String,
        required: false
    },
    offlineMode: { 
        type: Boolean,
        required: false
    },
    isAppForceUpdateEnabled: { 
        type: Boolean,
        required: false
    },
    isManualEditEnabled: { 
        type: Boolean,
        required: false
    },
    scanTimeoutMs: { 
        type: Number,
        required: false
    },
    district:{
        type: String,
        required: true
    },
    isFBAnalyticsEnabled: {
        type: Boolean,
        required: false,
    },
    block:{
        type: String,
        required: false
    },
    useCase2:{
        type: Boolean,
        required: false
    },
    useCase3:{
        type: Boolean,
        required: false
    },
    useCase4:{
        type: Boolean,
        required: false
    },
    useCase5:{
        type: Boolean,
        required: false
    },
}, {
    timestamps: false
})




// Hiding private data
schoolSchema.methods.toJSON = function () {
    const school = this
    const schoolObject = school.toObject()
    
    delete schoolObject.password
    delete schoolObject.tokens

    return schoolObject
}

// const Schools = mongoose.model('School', schoolSchema)

module.exports = schoolSchema