export const pathologyOptions = {
  decay: {
    etapa: [
      { value: 'dentin', label: 'Dentina', next: { cavitación: [
        { value: 'cavitation', label: 'Cavitación', next: { pulpa: [
          { value: 'pulpInvolved', label: 'Pulpa comprometida', next: { nivel: [
            { value: 'C1', label: 'C1' }, { value: 'C2', label: 'C2' }, { value: 'C3', label: 'C3' }, { value: 'C4', label: 'C4' }
          ] } },
          { value: 'pulpNotInvolved', label: 'Pulpa no comprometida', next: { nivel: [
            { value: 'C1', label: 'C1' }, { value: 'C2', label: 'C2' }, { value: 'C3', label: 'C3' }, { value: 'C4', label: 'C4' }
          ] } }
        ] } },
        { value: 'noCavitation', label: 'Sin cavitación', next: { nivel: [
          { value: 'C1', label: 'C1' }, { value: 'C2', label: 'C2' }, { value: 'C3', label: 'C3' }, { value: 'C4', label: 'C4' }
        ] } }
      ] } },
      { value: 'enamel', label: 'Esmalte', next: { cavitación: [
        { value: 'cavitation', label: 'Cavitación', next: { nivel: [
          { value: 'C1', label: 'C1' }, { value: 'C2', label: 'C2' }, { value: 'C3', label: 'C3' }, { value: 'C4', label: 'C4' }
        ] } },
        { value: 'noCavitation', label: 'Sin cavitación', next: { nivel: [
          { value: 'C1', label: 'C1' }, { value: 'C2', label: 'C2' }, { value: 'C3', label: 'C3' }, { value: 'C4', label: 'C4' }
        ] } }
      ] } }
    ]
  },
  fracture: {
    tipoFractura: [
      { value: 'crownFracture', label: 'Fractura coronaria', next: { dirección: [ { value: 'Vertical', label: 'Vertical' }, { value: 'Horizontal', label: 'Horizontal' } ] } },
      { value: 'rootFracture', label: 'Fractura radicular', next: { dirección: [ { value: 'Vertical', label: 'Vertical' }, { value: 'Horizontal', label: 'Horizontal' } ] } }
    ]
  },
  toothWear: {
    tipoDesgaste: [
      { value: 'abrasion', label: 'Abrasión', next: { superficie: { options: [ { value: 'Buccal', label: 'Vestibular' }, { value: 'Palatal', label: 'Palatina' } ], multiple: true } } },
      { value: 'erosion', label: 'Erosión', next: { superficie: { options: [ { value: 'Buccal', label: 'Vestibular' }, { value: 'Palatal', label: 'Palatina' } ], multiple: true } } }
    ]
  },
  discoloration: { color: [ { value: 'gray', label: 'Gris' }, { value: 'red', label: 'Rojo' }, { value: 'yellow', label: 'Amarillo' } ] },
  apical: { respuesta: [ { value: 'yes', label: 'Sí' }, { value: 'no', label: 'No' } ] },
  developmentDisorder: { respuesta: [ { value: 'yes', label: 'Sí' }, { value: 'no', label: 'No' } ] }
}