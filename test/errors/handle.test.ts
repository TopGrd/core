import {captureOutput} from '@oclif/test'
import {expect} from 'chai'
import process from 'node:process'
import sinon from 'sinon'

import {Command, Flags} from '../../src'
import {CLIError, ExitError, exit as exitErrorThrower} from '../../src/errors'
import {Exit, handle} from '../../src/errors/handle'
import * as Help from '../../src/help'

const x = process.platform === 'win32' ? '»' : '›'

describe('handle', () => {
  let exitStub: sinon.SinonStub

  beforeEach(() => {
    exitStub = sinon.stub(Exit, 'exit')
  })

  afterEach(() => {
    sinon.restore()
  })

  it('hides an exit error', async () => {
    const {stdout, stderr} = await captureOutput(() => handle(new ExitError(0)))
    expect(stdout).to.be.empty
    expect(stderr).to.be.empty
    expect(exitStub.firstCall.firstArg).to.equal(0)
  })

  it('prints error', async () => {
    const error = new Error('foo bar baz') as Error & {skipOclifErrorHandling: boolean}
    error.skipOclifErrorHandling = false

    const {stdout, stderr} = await captureOutput(() => handle(error))

    expect(stdout).to.be.empty
    expect(stderr).to.include('foo bar baz')
  })

  it('should not print error when skipOclifErrorHandling is true', async () => {
    const error = new Error('foo bar baz') as Error & {skipOclifErrorHandling: boolean}
    error.skipOclifErrorHandling = true
    const {stdout, stderr} = await captureOutput(() => handle(error))
    expect(stdout).to.be.empty
    expect(stderr).to.be.empty
  })

  it('logs error with symbol', async () => {
    const {stderr} = await captureOutput(() => handle(new CLIError('uh oh!')))
    expect(stderr).to.equal(` ${x}   Error: uh oh!\n`)
  })

  it('should use default exit code for Error (1)', async () => {
    const error = new Error('foo bar baz')
    const {stdout, stderr} = await captureOutput(() => handle(error))
    expect(stdout).to.be.empty
    expect(stderr).to.include('foo bar baz')
    expect(exitStub.firstCall.firstArg).to.equal(1)
  })

  it('should use default exit code for CLIError (2)', async () => {
    const error = new CLIError('foo bar baz')
    const {stdout, stderr} = await captureOutput(() => handle(error))
    expect(stdout).to.be.empty
    expect(stderr).to.include('foo bar baz')
    expect(exitStub.firstCall.firstArg).to.equal(2)
  })

  it('should use exit code provided by CLIError (0)', async () => {
    const error = new CLIError('foo bar baz', {exit: 0})
    const {stdout, stderr} = await captureOutput(() => handle(error))
    expect(stdout).to.be.empty
    expect(stderr).to.include('foo bar baz')
    expect(exitStub.firstCall.firstArg).to.equal(0)
  })

  it('should use exit code provided by CLIError (9999)', async () => {
    const error = new CLIError('foo bar baz', {exit: 9999})
    const {stdout, stderr} = await captureOutput(() => handle(error))
    expect(stdout).to.be.empty
    expect(stderr).to.include('foo bar baz')
    expect(exitStub.firstCall.firstArg).to.equal(9999)
  })

  it('should print help', async () => {
    class MyCommand extends Command {
      static flags = {
        foo: Flags.string(),
        bar: Flags.string(),
      }

      async run() {
        await this.parse(MyCommand)
      }
    }

    const classStubbedInstance = sinon.createStubInstance(Help.Help)
    const constructorStub = sinon.stub(Help, 'Help').returns(classStubbedInstance)
    await captureOutput(async () => {
      try {
        await MyCommand.run(['--DOES_NOT_EXIST'])
      } catch (error: any) {
        await handle(error)
      }
    })

    expect(constructorStub.calledOnce).to.be.true
    const [, options] = constructorStub.firstCall.args
    expect(options).to.deep.equal({
      sections: ['flags', 'usage', 'arguments'],
      sendToStderr: true,
    })
  })

  describe('exit', () => {
    it('exits without displaying anything', async () => {
      const {stdout, stderr} = await captureOutput(async () => {
        try {
          exitErrorThrower(9000)
        } catch (error: any) {
          await handle(error)
        }
      })

      expect(stdout).to.be.empty
      expect(stderr).to.be.empty
      expect(exitStub.firstCall.firstArg).to.equal(9000)
    })
  })
})
