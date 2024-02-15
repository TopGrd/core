import {expect} from 'chai'
import {resolve} from 'node:path'
import {SinonSandbox, SinonStub, createSandbox} from 'sinon'
import stripAnsi from 'strip-ansi'

import {run, ux} from '../../src/index'

describe('explicit command discovery strategy', () => {
  let sandbox: SinonSandbox
  let stdoutStub: SinonStub

  beforeEach(() => {
    sandbox = createSandbox()
    stdoutStub = sandbox.stub(ux.write, 'stdout')
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should show help for commands', async () => {
    await run(['--help', 'foo'], resolve(__dirname, 'fixtures/bundled-cli/package.json'))
    const [first, ...rest] = stdoutStub.args.map((a) => stripAnsi(a[0]))
    expect(first).to.equal('example hook running --help\n')
    expect(rest.join('')).to.equal(`foo topic description

USAGE
  $ oclif foo COMMAND

COMMANDS
  foo alias  foo bar description
  foo bar    foo bar description
  foo baz    foo baz description

`)
  })

  it('should run command', async () => {
    await run(['foo:bar'], resolve(__dirname, 'fixtures/bundled-cli/package.json'))
    const [first, second] = stdoutStub.args.map((a) => stripAnsi(a[0]))
    expect(first).to.equal('example hook running foo:bar\n')
    expect(second).to.equal('hello world!\n')
  })

  it('should run alias', async () => {
    await run(['foo:alias'], resolve(__dirname, 'fixtures/bundled-cli/package.json'))
    const [first, second] = stdoutStub.args.map((a) => stripAnsi(a[0]))
    expect(first).to.equal('example hook running foo:alias\n')
    expect(second).to.equal('hello world!\n')
  })
})
