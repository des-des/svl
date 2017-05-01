const test = require('tape')

const svl = require('../lib/component.js')
const { component } = svl({})

test('component.getSpec', t => {
  const mockSpec = { some: 'data' }
  const mockSpecCopy = Object.assign({}, mockSpec)

  t.equal(
    component(mockSpec).getSpec(),
    mockSpec,
    'we get back the same spec object we recieved'
  )

  t.deepEqual(
    component(mockSpec).getSpec(),
    mockSpecCopy,
    'it has not been mutated'
  )

  t.end()
})

test('component.getChildren', t => {
  const mockSpec = { children: 'children' }
  t.equal(
    component(mockSpec).getChildren(),
    'children',
    'returns children'
  )

  t.deepEqual(
    component({}).getChildren(),
    [],
    'returns empty array if children do not exist'
  )

  t.end()
})

test('component.update', t => {
  const mockSpec = {}
  const newSpec = component(mockSpec).update({}).getSpec()

  t.equal(
    newSpec,
    mockSpec,
    'identity does not create new spec object'
  )

  t.deepEqual(
    newSpec,
    {},
    'identity does not change spec'
  )

  const comp = component(mockSpec)
  t.equal(
    comp,
    comp.update(),
    'empty update return component'
  )

  const specWithUpdates = {
    updateListeners: {
      updateProp: [['outerKey', 'innerKey']]
    }
  }
  const updatedComponent = component(specWithUpdates)
    .update({
      updateProp: 'updateValue',
      anotherProp: 'should get thrown away'
    })

  const expectedSpec = Object.assign(
    {},
    specWithUpdates,
    { outerKey: { innerKey: 'updateValue' } }
  )

  t.deepEqual(
    updatedComponent.getSpec(),
    expectedSpec,
    'update sets value in spec'
  )

  const specWithChildren = {
    children: [
      component({ updateListeners: { updateName: [['updateKey']] } }),
      'second child'
    ]
  }

  const updatedChildren = component(specWithChildren)
    .update({ updateName: 'updateValue' })
    .getChildren()

  t.equal(
    updatedChildren[0].getSpec().updateKey,
    'updateValue',
    'succesfully updates child'
  )

  t.equal(
    updatedChildren[1],
    'second child',
    'second child unchanged'
  )

  t.end()
})

test('component.getHtml', t => {
  const mockSpec = {
    tag: 'div',
    checked: null,
    class: 'big'
  }

  t.equal(
    component(mockSpec).getHtml(),
    `<div checked class="big"></div>`,
    'can render basic div'
  )

  t.equal(
    component({ innerHtml: 'text' }).getHtml(),
    'text',
    'returns innerHtml if component has not tag'
  )

  const specWithChildren = {
    tag: 'div',
    children: [
      component({ tag: 'div' }),
      'text'
    ]
  }
  t.equal(
    component(specWithChildren).getHtml(),
    `<div><div></div>text</div>`,
    'can render nested div'
  )

  t.end()
})
