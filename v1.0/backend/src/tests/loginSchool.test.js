const User = require('../models/users');
const School = require("../models/school")
const ClassModel = require("../models/classes")
const schoolController = require('../controller/schoolController')

const Helper = require('../middleware/helper')
const dummyPass = require('../utils/commonUtils')


const mockSchoolData = require("./mock-data/school.json")
const mockSignInUser = require("./mock-data/signInUserData.json");
const mockClassData = require("./mock-data/classes.json")


const mockRequest = () => {
  const req = {}
  req.body = jest.fn().mockReturnValue(req)
  req.params = jest.fn().mockReturnValue(req)
  req.dbConnection = {
    model: (ref, schema) => {
        return schema
    }
  }
  return req
}

const mockResponse = () => {
  const res = {}
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res
}

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1MDAxIiwic2Nob29sSWQiOiJ1MDAxIiwiaWF0IjoxNjcxMTY4OTY3fQ.jwx3xxTTP3dtJwJFUD4QAUsuBT8uemzyTpiKEIRhzKg"


describe('login school', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  
  it("should not login when password is not correct ", async () => {
    const req = mockRequest();
    const res = mockResponse()
    req.body = {
      "schoolId": "u001",
      "password": "tarento"
    }
    
    Helper.findByCredentials = jest.fn().mockImplementation(() => {
      throw new Error('School Id or Password is not correct.')
    });
    await schoolController.loginSchool(req, res, jest.fn())

    expect(Helper.findByCredentials).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json({ status: 'fail' }));
    expect(res.json({ error: 'School Id or Password is not correct.' }));
  });

  it("should not login when school is locked ", async () => {
    const req = mockRequest();
    const res = mockResponse()
    req.body = {
      "schoolId": "u001",
      "password": dummyPass
    }
    Helper.findByCredentials = jest.fn().mockImplementationOnce(() => ({ select: jest.fn().mockResolvedValueOnce(mockSignInUser) }));
    School.findOne = jest.fn().mockResolvedValue(mockSchoolData)
    Helper.lockScreenValidator = jest.fn().mockImplementation(() => {
      throw new Error('State/District/School is locked for scanning')
    });

    await schoolController.loginSchool(req, res, jest.fn())

    expect(Helper.findByCredentials).toHaveBeenCalledTimes(1)
    expect(School.findOne).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json({ status: 'fail' }));
    expect(res.json({ error: 'State/District/School is locked for scanning' }));
  });

  it("should able to login to school  ", async () => {
    const req = mockRequest();
    const res = mockResponse()
    req.body = {
      "schoolId": "u001",
      "password": dummyPass,
      "classes": true
    }

    Helper.findByCredentials = jest.fn().mockImplementationOnce(() => ({ select: jest.fn().mockResolvedValueOnce(mockSignInUser) }));
    School.findOne = jest.fn().mockResolvedValue(mockSchoolData)
    ClassModel.find = jest.fn().mockResolvedValue(mockClassData)
    Helper.lockScreenValidator = jest.fn().mockResolvedValue(undefined)

    User.generateAuthToken = jest.fn().mockResolvedValue(token)

    await schoolController.loginSchool(req, res, jest.fn())

    expect(Helper.findByCredentials).toHaveBeenCalledTimes(1)
    expect(School.findOne).toHaveBeenCalledTimes(1)
    expect(Helper.lockScreenValidator).toHaveBeenCalledTimes(1)
    expect(User.generateAuthToken).toHaveBeenCalledTimes(1)
    expect(ClassModel.find).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json({ status: 'success' }).status(200));
  });

  it("should not be able to login to school when class data is missing ", async () => {
    const req = mockRequest();
    const res = mockResponse()
    req.body = {
      "schoolId": "u001",
      "password": dummyPass,
      "classes": true
    }

    Helper.findByCredentials = jest.fn().mockImplementationOnce(() => ({ select: jest.fn().mockResolvedValueOnce(mockSignInUser) }));
    School.findOne = jest.fn().mockResolvedValue(mockSchoolData)
    ClassModel.find = jest.fn().mockResolvedValue()
    Helper.lockScreenValidator = jest.fn().mockResolvedValue(undefined)

    User.generateAuthToken = jest.fn().mockResolvedValue(token)

    await schoolController.loginSchool(req, res, jest.fn())

    expect(Helper.findByCredentials).toHaveBeenCalledTimes(1)
    expect(School.findOne).toHaveBeenCalledTimes(1)
    expect(Helper.lockScreenValidator).toHaveBeenCalledTimes(1)
    expect(User.generateAuthToken).toHaveBeenCalledTimes(1)
    expect(ClassModel.find).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json({ e: "No Classes" }).status(400));
  });

});

