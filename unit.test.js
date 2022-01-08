/* eslint-env jest */
/* eslint-disable no-new */

import YarnBound from './src/yarn-bound'
import bondage from '@mnbroatch/bondage'

jest.mock('@mnbroatch/bondage')
bondage.Runner.prototype.run.mockImplementation(function * () {
  while (true) yield new bondage.TextResult()
})
// It's convenient to make actual results objects in test
const actualBondage = jest.requireActual('@mnbroatch/bondage')
bondage.TextResult = actualBondage.TextResult
bondage.OptionsResult = actualBondage.OptionsResult
bondage.CommandResult = actualBondage.CommandResult

describe('constructor', () => {
  const dialogue = []
  test('should load a dialogue object into the runner', () => {
    new YarnBound({ dialogue })
    expect(bondage.Runner.prototype.load)
      .toHaveBeenCalledWith(dialogue)
  })

  test('should strip leading whitespace up to the header delimiter and load a dialogue into the runner', () => {
    const dialogueWithLeadingWhitespace = `
      title:Start
      ---
      text
      ===
    `
    const dialogueWithNoLeadingWhitespace = `
title:Start
---
text
===
    `
    new YarnBound({ dialogue: dialogueWithLeadingWhitespace })
    expect(bondage.Runner.prototype.load)
      .toHaveBeenCalledWith(dialogueWithNoLeadingWhitespace)
  })

  test('should set the variable storage if provided', () => {
    const variableStorage = new Map()
    new YarnBound({ variableStorage })
    expect(bondage.Runner.prototype.setVariableStorage)
      .toHaveBeenCalledWith(variableStorage)
  })

  test('should register provided functions', () => {
    const functions = {
      functionOne: () => {},
      functionTwo: () => {}
    }
    new YarnBound({ functions })
    Object.entries(functions).forEach(([key, func]) => {
      expect(bondage.Runner.prototype.registerFunction)
        .toHaveBeenCalledWith(key, func)
    })
  })

  test('should register provided functions', () => {
    const functions = {
      functionOne: () => {},
      functionTwo: () => {}
    }
    new YarnBound({ functions })
    Object.entries(functions).forEach(([key, func]) => {
      expect(bondage.Runner.prototype.registerFunction)
        .toHaveBeenCalledWith(key, func)
    })
  })

  test('should start the generator at the node with the provided "startAt" title', () => {
    const startAt = 'someStartingNode'
    new YarnBound({ startAt })
    expect(bondage.Runner.prototype.run).toHaveBeenCalledWith(startAt)
  })

  test('should start the generator at the "Start" node if startAt is undefined', () => {
    new YarnBound({})
    expect(bondage.Runner.prototype.run).toHaveBeenCalledWith('Start')
  })

  test('should attach the generator to the instance', () => {
    const runner = new YarnBound({})
    expect(runner.generator).toBe(bondage.Runner.prototype.run.mock.results[0].value)
  })

  test('should advance the generator', () => {
    jest.spyOn(YarnBound.prototype, 'advance')
    new YarnBound({})
    expect(YarnBound.prototype.advance).toHaveBeenCalled()
  })
})

describe('advance', () => {
  const mockCommandArgs1 = ['a', 'b']
  const mockCommandArgs2 = ['c', 'd']
  const mockCommandName1 = 'blah'
  const mockCommandName2 = 'bleh'
  const mockCommandResult1 = new bondage.CommandResult(mockCommandName1, mockCommandArgs1)
  const mockCommandResult2 = new bondage.CommandResult(mockCommandName2, mockCommandArgs2)
  const mockTextResult1 = new bondage.TextResult('marge')
  const mockTextResult2 = new bondage.TextResult('maggie')
  const mockTextResult3 = new bondage.TextResult('homer')
  const mockOptionsResult = new bondage.OptionsResult(['bart', 'lisa'])
  describe('where next nodes are a TextResult followed by OptionsResult', () => {
    beforeAll(() => {
      bondage.Runner.prototype.run.mockImplementation(function * () {
        yield mockTextResult1
        yield mockOptionsResult
        yield mockTextResult2
        yield mockTextResult3
      })
    })

    test('should set currentResult to an Options object with the text attached if combineTextAndOptionsResults is false', () => {
      const runner = new YarnBound({ combineTextAndOptionsResults: true })
      expect(runner.currentResult).toEqual({ ...mockOptionsResult, ...mockTextResult1 })
      expect(runner.currentResult).toBeInstanceOf(bondage.OptionsResult)
    })

    test('should not set currentResult to an Options object with the text attached', () => {
      const runner = new YarnBound({})
      expect(runner.currentResult).toBe(mockTextResult1)
      runner.advance()
      expect(runner.currentResult).toBe(mockOptionsResult)
    })

    test('should select the option with the index passed in, if there is one', () => {
      const runner = new YarnBound({})
      expect(runner.currentResult).toBe(mockTextResult1)
      runner.advance()
      const currentResult = runner.currentResult
      expect(runner.currentResult).toBe(mockOptionsResult)
      jest.spyOn(currentResult, 'select')
      runner.advance(1)
      expect(currentResult.select).toHaveBeenCalledWith(1)
      expect(runner.currentResult).toBe(mockTextResult2)
    })
  })

  describe('where next nodes are CommandResults followed by TextResults', () => {
    beforeAll(() => {
      bondage.Runner.prototype.run.mockImplementation(function * () {
        yield mockCommandResult1
        yield mockCommandResult2
        yield mockTextResult1
        yield mockTextResult2
      })
    })

    test('should set currentResult to the command result if handleCommand is not supplied', () => {
      const runner = new YarnBound({})
      expect(runner.currentResult).toBe(mockCommandResult1)
      runner.advance()
      expect(runner.currentResult).toBe(mockCommandResult2)
    })

    test('should set currentResult to the next non-command result if handleCommand is supplied', () => {
      const runner = new YarnBound({ handleCommand: () => {} })
      expect(runner.currentResult).toBe(mockTextResult1)
    })

    test('should call the command handler with the correct arguments for each command result', () => {
      const handleCommand = jest.fn()
      new YarnBound({ handleCommand })
      expect(handleCommand).toHaveBeenNthCalledWith(1, {
        name: mockCommandName1,
        args: mockCommandArgs1
      })
      expect(handleCommand).toHaveBeenNthCalledWith(2, {
        name: mockCommandName2,
        args: mockCommandArgs2
      })
    })
  })

  describe('when dialogue ends', () => {
    beforeAll(() => {
      bondage.Runner.prototype.run.mockImplementation(function * () {
        yield mockTextResult1
      })
    })

    test('should include an "isDialogueEnd" property on the currentResult', () => {
      const runner = new YarnBound({})
      expect(runner.currentResult).toEqual({ ...mockTextResult1, isDialogueEnd: true })
    })
  })
})
